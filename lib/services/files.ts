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
  | { ok: true; id: string; filename: string; sizeBytes: number }
  | { ok: false; error: string; status?: number };

export async function uploadDeliverableFile(params: {
  user: SessionUser;
  deliverableId: string;
  filename: string;
  mimeType: string;
  body: ReadableStream<Uint8Array> | null;
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

  const created = await prisma.fileUpload.create({
    data: {
      id,
      deliverableId: params.deliverableId,
      userId: params.user.id,
      filename,
      url: `/api/files/${id}`,
      mimeType,
      sizeBytes: bytesWritten,
    },
  });

  await writeAudit({
    userId: params.user.id,
    deliverableId: params.deliverableId,
    action: "UPLOADED",
    entityType: "FileUpload",
    entityId: created.id,
    metadata: { filename, sizeBytes: bytesWritten, mimeType },
  });

  return { ok: true, id: created.id, filename, sizeBytes: bytesWritten };
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

  await unlink(storagePath(record.id)).catch(() => undefined);
  await prisma.fileUpload.delete({ where: { id: record.id } });

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
    where: { deliverableId },
    orderBy: { uploadedAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
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
