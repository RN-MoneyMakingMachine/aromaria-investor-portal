import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";
import { isPdfConvertible, pdfFilenameFor } from "@/lib/pdf-convertible";
import { getFileForDownload } from "@/lib/services/files";
import { convertOfficeFileToPdf } from "@/lib/services/pdf-convert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function GET(
  req: Request,
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

  if (!isPdfConvertible(file.mimeType)) {
    return NextResponse.json(
      { error: "This file type cannot be converted to PDF." },
      { status: 415 },
    );
  }

  const result = await convertOfficeFileToPdf({
    sourcePath: file.storagePath,
    mimeType: file.mimeType,
    filename: file.filename,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const wantsInline = new URL(req.url).searchParams.get("inline") === "1";
  const downloadName = pdfFilenameFor(file.filename);
  const fallbackName = downloadName.replace(/[^\x20-\x7e]/g, "_");
  const utf8Name = encodeURIComponent(downloadName);
  const disposition = wantsInline ? "inline" : "attachment";

  return new Response(new Uint8Array(result.bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(result.bytes.length),
      "content-disposition": `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${utf8Name}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
