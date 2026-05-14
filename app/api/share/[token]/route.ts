import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { writeAudit } from "@/lib/audit";
import {
  isInlineSafe,
  isPdfConvertible,
  pdfFilenameFor,
} from "@/lib/pdf-convertible";
import { getFileById, openFileStream } from "@/lib/services/files";
import { convertOfficeFileToPdf } from "@/lib/services/pdf-convert";
import { decodeShareToken } from "@/lib/share-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const decoded = decodeShareToken(token);
  if (!decoded.ok) {
    const status = decoded.reason === "expired" ? 410 : 400;
    const message =
      decoded.reason === "expired"
        ? "This share link has expired."
        : "This share link is not valid.";
    return NextResponse.json({ error: message }, { status });
  }

  const file = await getFileById(decoded.payload.fileId);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  await writeAudit({
    action: "SHARE_LINK_OPENED",
    entityType: "FileUpload",
    entityId: file.id,
    metadata: { mode: decoded.payload.mode },
  });

  if (decoded.payload.mode === "download") {
    return streamOriginal(file, "attachment", "application/octet-stream");
  }

  if (isInlineSafe(file.mimeType)) {
    return streamOriginal(file, "inline", file.mimeType);
  }

  if (isPdfConvertible(file.mimeType)) {
    const result = await convertOfficeFileToPdf({
      sourcePath: file.storagePath,
      mimeType: file.mimeType,
      filename: file.filename,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    const downloadName = pdfFilenameFor(file.filename);
    return new Response(new Uint8Array(result.bytes), {
      headers: dispositionHeaders({
        disposition: "inline",
        contentType: "application/pdf",
        filename: downloadName,
        length: result.bytes.length,
      }),
    });
  }

  // Anything not previewable falls back to a download with the original
  // filename — better than a confusing error for the recipient.
  return streamOriginal(file, "attachment", "application/octet-stream");
}

function streamOriginal(
  file: { storagePath: string; filename: string; sizeBytes: number },
  disposition: "inline" | "attachment",
  contentType: string,
): Response {
  const nodeStream = openFileStream(file.storagePath);
  const webStream = Readable.toWeb(
    nodeStream as Readable,
  ) as ReadableStream<Uint8Array>;
  return new Response(webStream, {
    headers: dispositionHeaders({
      disposition,
      contentType,
      filename: file.filename,
      length: file.sizeBytes,
    }),
  });
}

function dispositionHeaders(opts: {
  disposition: "inline" | "attachment";
  contentType: string;
  filename: string;
  length: number;
}): Record<string, string> {
  const fallbackName = opts.filename.replace(/[^\x20-\x7e]/g, "_");
  const utf8Name = encodeURIComponent(opts.filename);
  return {
    "content-type": opts.contentType,
    "content-length": String(opts.length),
    "content-disposition": `${opts.disposition}; filename="${fallbackName}"; filename*=UTF-8''${utf8Name}`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };
}
