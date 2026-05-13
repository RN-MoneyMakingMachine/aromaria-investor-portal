import "server-only";

import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";
import { canEdit, canUpload } from "@/lib/rbac";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { runDiff } from "@/lib/services/ai-diff";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

function safeFilename(name: string): string {
  const base = path.basename(name).replace(/[\x00-\x1f<>:"/\\|?*]+/g, "_").trim();
  if (!base) return "file";
  return base.slice(0, 200);
}

function storagePath(fileId: string): string {
  return path.join(UPLOAD_DIR, `${fileId}.bin`);
}

export type UploadResult =
  | {
      ok: true;
      id: string;
      filename: string;
      sizeBytes: number;
      version: number;
    }
  | { ok: false; error: string; status?: number };

export async function uploadDeliverableFile(params: {
  user: SessionUser;
  deliverableId: string;
  filename: string;
  mimeType: string;
  body: ReadableStream<Uint8Array> | null;
  previousVersionId?: string;
  replacingFinal?: boolean;
}): Promise<UploadResult> {
  if (!canUpload(params.user)) {
    return { ok: false, error: "You are not allowed to upload files.", status: 403 };
  }
  if (!params.body) {
    return { ok: false, error: "Empty request body.", status: 400 };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: params.deliverableId },
    select: { id: true },
  });
  if (!deliverable) {
    return { ok: false, error: "Deliverable not found.", status: 404 };
  }

  let previousVersion: {
    id: string;
    version: number;
    deliverableId: string | null;
    isCurrent: boolean;
  } | null = null;
  if (params.previousVersionId) {
    previousVersion = await prisma.fileUpload.findUnique({
      where: { id: params.previousVersionId },
      select: {
        id: true,
        version: true,
        deliverableId: true,
        isCurrent: true,
      },
    });
    if (!previousVersion) {
      return { ok: false, error: "Previous version not found.", status: 404 };
    }
    if (previousVersion.deliverableId !== params.deliverableId) {
      return {
        ok: false,
        error: "Previous version belongs to a different deliverable.",
        status: 400,
      };
    }
    if (!previousVersion.isCurrent) {
      return {
        ok: false,
        error:
          "A newer version of this document already exists. Upload as a version of the latest instead.",
        status: 409,
      };
    }
    if (!params.replacingFinal) {
      const finalInChain = await chainHasFinal(previousVersion.id);
      if (finalInChain) {
        return {
          ok: false,
          error:
            "This document already has a FINAL version. Unmark final first, or pass replacingFinal to override.",
          status: 409,
        };
      }
    }
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

  const nextVersion = previousVersion ? previousVersion.version + 1 : 1;
  const aiDiffStatus = previousVersion ? "pending" : null;

  const created = await prisma.$transaction(async (tx) => {
    if (previousVersion) {
      await tx.fileUpload.update({
        where: { id: previousVersion.id },
        data: { isCurrent: false },
      });
    }
    return tx.fileUpload.create({
      data: {
        id,
        deliverableId: params.deliverableId,
        userId: params.user.id,
        filename,
        url: `/api/files/${id}`,
        mimeType,
        sizeBytes: bytesWritten,
        version: nextVersion,
        isCurrent: true,
        previousVersionId: previousVersion?.id ?? null,
        aiDiffStatus,
      },
    });
  });

  await writeAudit({
    userId: params.user.id,
    deliverableId: params.deliverableId,
    action: previousVersion ? "VERSION_UPLOADED" : "UPLOADED",
    entityType: "FileUpload",
    entityId: created.id,
    metadata: {
      filename,
      sizeBytes: bytesWritten,
      mimeType,
      version: nextVersion,
      previousVersionId: previousVersion?.id,
    },
  });

  if (previousVersion) {
    // Fire-and-forget. Errors are logged inside runDiff and persisted to
    // the row so the UI can surface them.
    void runDiff(created.id).catch((err) => {
      // Last-resort log; runDiff also writes to aiDiffError/audit.
      console.error("[ai-diff] background failure", created.id, err);
    });
  }

  return {
    ok: true,
    id: created.id,
    filename,
    sizeBytes: bytesWritten,
    version: nextVersion,
  };
}

async function chainHasFinal(versionId: string): Promise<boolean> {
  // Walk backwards through previousVersionId, then forwards via
  // nextVersions starting from the root. With chains of <20 entries this
  // is cheap.
  let cursor = versionId;
  let root = await prisma.fileUpload.findUnique({
    where: { id: cursor },
    select: { id: true, previousVersionId: true, isFinal: true },
  });
  while (root && root.previousVersionId) {
    cursor = root.previousVersionId;
    root = await prisma.fileUpload.findUnique({
      where: { id: cursor },
      select: { id: true, previousVersionId: true, isFinal: true },
    });
  }
  if (!root) return false;
  return await hasFinalInDescendants(root.id, root.isFinal);
}

async function hasFinalInDescendants(
  rootId: string,
  rootIsFinal: boolean,
): Promise<boolean> {
  if (rootIsFinal) return true;
  const stack = [rootId];
  while (stack.length) {
    const next = stack.pop()!;
    const kids = await prisma.fileUpload.findMany({
      where: { previousVersionId: next },
      select: { id: true, isFinal: true },
    });
    for (const k of kids) {
      if (k.isFinal) return true;
      stack.push(k.id);
    }
  }
  return false;
}

export type FileForDownload = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};

export async function getFileForDownload(
  user: SessionUser,
  fileId: string,
): Promise<FileForDownload | null> {
  // any authenticated portal user can download
  if (!user) return null;
  const record = await prisma.fileUpload.findUnique({
    where: { id: fileId },
  });
  if (!record) return null;
  const onDisk = storagePath(record.id);
  if (!existsSync(onDisk)) return null;
  return {
    id: record.id,
    filename: record.filename,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    storagePath: onDisk,
  };
}

export function openFileStream(p: string): NodeJS.ReadableStream {
  return createReadStream(p);
}

export type DeleteFileResult =
  | { ok: true; deliverableId: string | null }
  | { ok: false; error: string; status?: number };

export async function deleteFile(
  user: SessionUser,
  fileId: string,
): Promise<DeleteFileResult> {
  const record = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      userId: true,
      filename: true,
      deliverableId: true,
      isCurrent: true,
      isFinal: true,
      previousVersionId: true,
    },
  });
  if (!record) return { ok: false, error: "File not found.", status: 404 };

  const isOwner = record.userId === user.id;
  if (!isOwner && !canEdit(user)) {
    return {
      ok: false,
      error: "Only the uploader or an editor can delete this file.",
      status: 403,
    };
  }

  if (!record.isCurrent) {
    return {
      ok: false,
      error: "Delete the newer versions of this document first.",
      status: 409,
    };
  }

  if (record.isFinal) {
    return {
      ok: false,
      error: "This is the FINAL version. Unmark final before deleting.",
      status: 409,
    };
  }

  await prisma.$transaction(async (tx) => {
    if (record.previousVersionId) {
      // Promote the previous version back to head of chain.
      await tx.fileUpload.update({
        where: { id: record.previousVersionId },
        data: { isCurrent: true },
      });
    }
    await tx.fileUpload.delete({ where: { id: record.id } });
  });

  await unlink(storagePath(record.id)).catch(() => undefined);

  await writeAudit({
    userId: user.id,
    deliverableId: record.deliverableId ?? undefined,
    action: "FILE_DELETED",
    entityType: "FileUpload",
    entityId: record.id,
    metadata: { filename: record.filename },
  });

  return { ok: true, deliverableId: record.deliverableId };
}

export type MarkFinalResult =
  | { ok: true; deliverableId: string | null; isFinal: boolean }
  | { ok: false; error: string; status?: number };

export async function setFinal(
  user: SessionUser,
  fileId: string,
  isFinal: boolean,
): Promise<MarkFinalResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "Editor or admin only.", status: 403 };
  }
  const record = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      deliverableId: true,
      isCurrent: true,
      isFinal: true,
      previousVersionId: true,
    },
  });
  if (!record) return { ok: false, error: "File not found.", status: 404 };

  if (isFinal && record.isFinal) {
    return { ok: true, deliverableId: record.deliverableId, isFinal: true };
  }
  if (!isFinal && !record.isFinal) {
    return { ok: true, deliverableId: record.deliverableId, isFinal: false };
  }

  if (isFinal) {
    // Clear any sibling final flag in the same chain so only one wins.
    const chainIds = await collectChainIds(record.id);
    await prisma.$transaction([
      prisma.fileUpload.updateMany({
        where: { id: { in: chainIds }, isFinal: true },
        data: { isFinal: false },
      }),
      prisma.fileUpload.update({
        where: { id: record.id },
        data: { isFinal: true },
      }),
    ]);
  } else {
    await prisma.fileUpload.update({
      where: { id: record.id },
      data: { isFinal: false },
    });
  }

  await writeAudit({
    userId: user.id,
    deliverableId: record.deliverableId ?? undefined,
    action: isFinal ? "MARKED_FINAL" : "UNMARKED_FINAL",
    entityType: "FileUpload",
    entityId: record.id,
  });

  return { ok: true, deliverableId: record.deliverableId, isFinal };
}

async function collectChainIds(versionId: string): Promise<string[]> {
  // walk to root, then DFS forward
  let cursor: string | null = versionId;
  let rootId: string = versionId;
  while (cursor) {
    const row: { id: string; previousVersionId: string | null } | null =
      await prisma.fileUpload.findUnique({
        where: { id: cursor },
        select: { id: true, previousVersionId: true },
      });
    if (!row) break;
    rootId = row.id;
    cursor = row.previousVersionId;
  }
  const ids = new Set<string>([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const next = stack.pop()!;
    const kids = await prisma.fileUpload.findMany({
      where: { previousVersionId: next },
      select: { id: true },
    });
    for (const k of kids) {
      ids.add(k.id);
      stack.push(k.id);
    }
  }
  return Array.from(ids);
}

export async function getStorageUsage(): Promise<{
  bytes: number;
  count: number;
}> {
  const result = await prisma.fileUpload.aggregate({
    _sum: { sizeBytes: true },
    _count: { _all: true },
  });
  return {
    bytes: result._sum.sizeBytes ?? 0,
    count: result._count._all,
  };
}

export async function listDeliverableFiles(deliverableId: string) {
  return prisma.fileUpload.findMany({
    where: { deliverableId, isCurrent: true },
    orderBy: { uploadedAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
}

export type ChainEntry = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  isCurrent: boolean;
  isFinal: boolean;
  previousVersionId: string | null;
  uploadedAt: Date;
  aiDiffStatus: string | null;
  aiDiffSummary: string | null;
  aiDiffError: string | null;
  user: { id: string; name: string };
};

export type DeliverableChain = {
  head: ChainEntry;
  chainHasFinal: boolean;
  finalId: string | null;
  history: ChainEntry[]; // newest-first, excludes head
};

export async function listDeliverableChains(
  deliverableId: string,
): Promise<DeliverableChain[]> {
  const rows = await prisma.fileUpload.findMany({
    where: { deliverableId },
    orderBy: { uploadedAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });

  // Group rows into chains by walking previousVersionId.
  const byId = new Map<string, (typeof rows)[number]>();
  for (const r of rows) byId.set(r.id, r);

  // For each row, find its root by following previousVersionId.
  function rootOf(id: string): string {
    let cur = id;
    const seen = new Set<string>();
    while (true) {
      if (seen.has(cur)) return cur;
      seen.add(cur);
      const row = byId.get(cur);
      if (!row || !row.previousVersionId) return cur;
      if (!byId.has(row.previousVersionId)) return cur;
      cur = row.previousVersionId;
    }
  }

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const root = rootOf(r.id);
    const arr = groups.get(root) ?? [];
    arr.push(r);
    groups.set(root, arr);
  }

  const chains: DeliverableChain[] = [];
  for (const [, members] of groups) {
    // newest first by uploadedAt (already from query) -> head is the
    // member with isCurrent === true, fallback to first.
    const head = members.find((m) => m.isCurrent) ?? members[0];
    const history = members.filter((m) => m.id !== head.id);
    const finalMember = members.find((m) => m.isFinal) ?? null;
    chains.push({
      head: toChainEntry(head),
      chainHasFinal: !!finalMember,
      finalId: finalMember?.id ?? null,
      history: history.map(toChainEntry),
    });
  }
  chains.sort(
    (a, b) => b.head.uploadedAt.getTime() - a.head.uploadedAt.getTime(),
  );
  return chains;
}

function toChainEntry(
  r: Awaited<ReturnType<typeof prisma.fileUpload.findMany>>[number] & {
    user: { id: string; name: string };
  },
): ChainEntry {
  return {
    id: r.id,
    filename: r.filename,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    version: r.version,
    isCurrent: r.isCurrent,
    isFinal: r.isFinal,
    previousVersionId: r.previousVersionId,
    uploadedAt: r.uploadedAt,
    aiDiffStatus: r.aiDiffStatus,
    aiDiffSummary: r.aiDiffSummary,
    aiDiffError: r.aiDiffError,
    user: { id: r.user.id, name: r.user.name },
  };
}

export async function getFinalForDeliverable(
  deliverableId: string,
): Promise<{ id: string } | null> {
  const row = await prisma.fileUpload.findFirst({
    where: { deliverableId, isFinal: true },
    select: { id: true },
  });
  return row ? { id: row.id } : null;
}

export async function getUploadDirInfo(): Promise<{
  configured: boolean;
  path: string;
  exists: boolean;
}> {
  return {
    configured: !!process.env.UPLOAD_DIR,
    path: UPLOAD_DIR,
    exists: existsSync(UPLOAD_DIR),
  };
}
