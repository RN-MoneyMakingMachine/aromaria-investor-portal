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

export function pdfFilenameFor(originalFilename: string): string {
  const base = originalFilename.replace(/\.[^./\\]+$/, "");
  return `${base || "document"}.pdf`;
}
