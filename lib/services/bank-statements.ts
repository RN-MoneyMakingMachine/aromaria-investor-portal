import "server-only";

import type { BankAccount } from "@prisma/client";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { writeAudit } from "@/lib/audit";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  canApproveSide,
  canEdit,
  canUpload,
  type SessionUser,
} from "@/lib/rbac";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

function storagePath(fileId: string): string {
  return path.join(UPLOAD_DIR, `${fileId}.bin`);
}

function safeFilename(name: string): string {
  const base = path
    .basename(name)
    .replace(/[\x00-\x1f<>:"/\\|?*]+/g, "_")
    .trim();
  if (!base) return "statement";
  return base.slice(0, 200);
}

// Monday-anchored "week of" helpers. We work in UTC so the boundary is the
// same for everyone regardless of timezone.

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// The Monday that STARTS the most recently completed Mon-Sun week. When a
// statement is uploaded, we tag it with this date — the week it covers.
export function mostRecentCompletedWeekStart(now: Date = new Date()): Date {
  const d = startOfUtcDay(now);
  const dow = d.getUTCDay(); // 0 = Sun ... 6 = Sat
  // Days since this week's Monday (today if Mon).
  const sinceThisMonday = (dow + 6) % 7;
  // Go back to last Monday's Monday = start of previous full week.
  d.setUTCDate(d.getUTCDate() - sinceThisMonday - 7);
  return d;
}

// The next upcoming Monday (strictly in the future) — the next due date.
export function nextMondayDeadline(now: Date = new Date()): Date {
  const d = startOfUtcDay(now);
  const dow = d.getUTCDay();
  const delta = ((8 - dow) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  const todayUtc = startOfUtcDay(now).getTime();
  const targetUtc = startOfUtcDay(target).getTime();
  return Math.round((targetUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

export type BankStatementRow = {
  id: string;
  account: BankAccount;
  weekOf: Date;
  fileId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  uploadedBy: { id: string; name: string };
  reviewedAt: Date | null;
  reviewedBy: { id: string; name: string } | null;
};

export async function listBankStatements(): Promise<BankStatementRow[]> {
  const rows = await prisma.bankStatement.findMany({
    orderBy: [{ weekOf: "desc" }, { uploadedAt: "desc" }],
    include: {
      file: {
        select: { filename: true, mimeType: true, sizeBytes: true },
      },
      uploadedBy: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    account: r.account,
    weekOf: r.weekOf,
    fileId: r.fileId,
    filename: r.file.filename,
    mimeType: r.file.mimeType,
    sizeBytes: r.file.sizeBytes,
    uploadedAt: r.uploadedAt,
    uploadedBy: r.uploadedBy,
    reviewedAt: r.reviewedAt,
    reviewedBy: r.reviewedBy,
  }));
}

export type CombinedStatus = "reviewed" | "needs_review";

// "Reviewed" only when every account has at least one statement AND its
// most-recent statement has been marked reviewed. Anything else (including
// missing accounts) reads as "needs_review".
export function computeCombinedStatus(
  rows: BankStatementRow[],
  accounts: ReadonlyArray<BankAccount>,
): CombinedStatus {
  for (const acct of accounts) {
    const latest = rows.find((r) => r.account === acct);
    if (!latest) return "needs_review";
    if (!latest.reviewedAt) return "needs_review";
  }
  return "reviewed";
}

export type UploadResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status: number };

export async function uploadBankStatement(params: {
  user: SessionUser;
  account: BankAccount;
  filename: string;
  mimeType: string;
  body: ReadableStream<Uint8Array> | null;
}): Promise<UploadResult> {
  if (!canUpload(params.user)) {
    return {
      ok: false,
      error: "You are not allowed to upload bank statements.",
      status: 403,
    };
  }
  if (!params.body) {
    return { ok: false, error: "Empty request body.", status: 400 };
  }

  const filename = safeFilename(params.filename);
  const mimeType = params.mimeType?.trim() || "application/octet-stream";

  await mkdir(UPLOAD_DIR, { recursive: true });

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const target = storagePath(id);

  let bytesWritten = 0;
  const aborted: { reason: string; status: number } = { reason: "", status: 0 };

  const reader = params.body.getReader();
  const monitored = new Readable({
    read() {
      reader
        .read()
        .then(({ value, done }) => {
          if (done) {
            this.push(null);
            return;
          }
          if (value) {
            bytesWritten += value.byteLength;
            if (bytesWritten > MAX_UPLOAD_BYTES) {
              aborted.reason = `File exceeds the ${Math.round(
                MAX_UPLOAD_BYTES / (1024 * 1024),
              )} MB limit.`;
              aborted.status = 413;
              this.destroy(new Error("size-limit"));
              return;
            }
            this.push(Buffer.from(value));
          }
        })
        .catch((err) => this.destroy(err));
    },
  });

  try {
    await pipeline(monitored, createWriteStream(target));
  } catch (err) {
    await unlink(target).catch(() => undefined);
    if (aborted.status !== 0) {
      return { ok: false, error: aborted.reason, status: aborted.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed.",
      status: 500,
    };
  }

  if (bytesWritten === 0) {
    await unlink(target).catch(() => undefined);
    return { ok: false, error: "Empty file.", status: 400 };
  }

  const weekOf = mostRecentCompletedWeekStart();

  const statement = await prisma.$transaction(async (tx) => {
    const file = await tx.fileUpload.create({
      data: {
        id,
        userId: params.user.id,
        filename,
        url: `/api/files/${id}`,
        mimeType,
        sizeBytes: bytesWritten,
        version: 1,
        isCurrent: true,
      },
    });
    return tx.bankStatement.create({
      data: {
        account: params.account,
        weekOf,
        fileId: file.id,
        uploadedById: params.user.id,
      },
    });
  });

  await writeAudit({
    userId: params.user.id,
    action: "BANK_STATEMENT_UPLOADED",
    entityType: "BankStatement",
    entityId: statement.id,
    metadata: {
      account: params.account,
      weekOf: weekOf.toISOString(),
      filename,
      sizeBytes: bytesWritten,
    },
  });

  return { ok: true, id: statement.id };
}

export type ReviewResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function markBankStatementReviewed(
  user: SessionUser,
  statementId: string,
): Promise<ReviewResult> {
  if (!canApproveSide(user, "OMOY")) {
    return {
      ok: false,
      error: "Only OMOY-side reviewers can mark statements reviewed.",
      status: 403,
    };
  }
  const existing = await prisma.bankStatement.findUnique({
    where: { id: statementId },
    select: { id: true, reviewedAt: true, account: true, weekOf: true },
  });
  if (!existing) {
    return { ok: false, error: "Statement not found.", status: 404 };
  }
  if (existing.reviewedAt) {
    return {
      ok: false,
      error: "Statement is already reviewed.",
      status: 409,
    };
  }
  await prisma.bankStatement.update({
    where: { id: statementId },
    data: {
      reviewedAt: new Date(),
      reviewedById: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "BANK_STATEMENT_REVIEWED",
    entityType: "BankStatement",
    entityId: statementId,
    metadata: {
      account: existing.account,
      weekOf: existing.weekOf.toISOString(),
    },
  });

  return { ok: true };
}

export type DeleteResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function deleteBankStatement(
  user: SessionUser,
  statementId: string,
): Promise<DeleteResult> {
  const existing = await prisma.bankStatement.findUnique({
    where: { id: statementId },
    select: {
      id: true,
      fileId: true,
      uploadedById: true,
      account: true,
      weekOf: true,
      file: { select: { filename: true } },
    },
  });
  if (!existing) {
    return { ok: false, error: "Statement not found.", status: 404 };
  }

  const isOwner = existing.uploadedById === user.id;
  if (!isOwner && !canEdit(user)) {
    return {
      ok: false,
      error: "Only the uploader or an editor can delete this statement.",
      status: 403,
    };
  }

  // FileUpload row has onDelete: Cascade on BankStatement.fileId, so removing
  // the file row also removes the BankStatement row.
  await prisma.fileUpload.delete({ where: { id: existing.fileId } });
  await unlink(storagePath(existing.fileId)).catch(() => undefined);

  await writeAudit({
    userId: user.id,
    action: "BANK_STATEMENT_DELETED",
    entityType: "BankStatement",
    entityId: existing.id,
    metadata: {
      account: existing.account,
      weekOf: existing.weekOf.toISOString(),
      filename: existing.file.filename,
    },
  });

  return { ok: true };
}
