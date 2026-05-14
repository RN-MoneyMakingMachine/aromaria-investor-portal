// Pure, side-effect-free helpers shared between the server-only PDF
// conversion service and the file-uploader client component. Anything
// that needs to import Node or "server-only" lives in lib/services/pdf-convert.ts.

export const PDF_CONVERTIBLE_MIME_TYPES: ReadonlySet<string> = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "text/rtf",
  "application/rtf",
  "text/plain",
  "text/csv",
]);

export function isPdfConvertible(mimeType: string): boolean {
  return PDF_CONVERTIBLE_MIME_TYPES.has(mimeType);
}

// Mime types the browser can render directly. SVG is deliberately excluded
// because it can contain script.
const INLINE_SAFE_MIME_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export function isInlineSafe(mimeType: string): boolean {
  return INLINE_SAFE_MIME_TYPES.has(mimeType);
}

export type ViewMode = "native" | "pdf" | "none";

// How a given file can be opened in a browser tab.
//   "native" -> serve the original via /api/files/{id}?inline=1
//   "pdf"    -> convert and serve via /api/files/{id}/pdf?inline=1
//   "none"   -> no in-browser preview, only download
export function viewableInBrowser(mimeType: string): ViewMode {
  if (isInlineSafe(mimeType)) return "native";
  if (isPdfConvertible(mimeType)) return "pdf";
  return "none";
}

export function pdfFilenameFor(originalFilename: string): string {
  const base = originalFilename.replace(/\.[^./\\]+$/, "");
  return `${base || "document"}.pdf`;
}
