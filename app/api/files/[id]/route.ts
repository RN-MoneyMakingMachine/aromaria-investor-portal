import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";
import {
  deleteFile,
  getFileForDownload,
  openFileStream,
} from "@/lib/services/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const file = await getFileForDownload(session.user as SessionUser, id);
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nodeStream = openFileStream(file.storagePath);
  const webStream = Readable.toWeb(nodeStream as Readable) as ReadableStream<Uint8Array>;

  const fallbackName = file.filename.replace(/[^\x20-\x7e]/g, "_");
  const utf8Name = encodeURIComponent(file.filename);

  return new Response(webStream, {
    headers: {
      // never let the browser inline-render user content
      "content-type": "application/octet-stream",
      "content-length": String(file.sizeBytes),
      "content-disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${utf8Name}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteFile(session.user as SessionUser, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({ ok: true });
}
