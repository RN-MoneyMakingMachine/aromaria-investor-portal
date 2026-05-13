import "server-only";

import { readFile } from "node:fs/promises";

const MAX_CHARS = 40_000;

export type ExtractedText = {
  text: string;
  truncated: boolean;
  format: "pdf" | "docx";
};

export type ExtractResult =
  | { ok: true; value: ExtractedText }
  | { ok: false; reason: "unsupported" | "empty" | "error"; detail?: string };

function detectFormat(buf: Buffer): "pdf" | "docx" | null {
  if (buf.length < 4) return null;
  if (
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46
  ) {
    return "pdf";
  }
  // .docx is a ZIP (PK\x03\x04). We don't disambiguate from generic zips
  // here; the consumer only calls this on files it expects to be PDF/DOCX.
  if (
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    buf[2] === 0x03 &&
    buf[3] === 0x04
  ) {
    return "docx";
  }
  return null;
}

function truncate(raw: string): { text: string; truncated: boolean } {
  if (raw.length <= MAX_CHARS) return { text: raw, truncated: false };
  const cut = raw.slice(0, MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > MAX_CHARS - 200 ? cut.slice(0, lastSpace) : cut;
  return { text: `${safe}\n\n[truncated]`, truncated: true };
}

async function extractPdf(path: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(await readFile(path));
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: unknown) => {
        if (it && typeof it === "object" && "str" in it) {
          return String((it as { str: string }).str);
        }
        return "";
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) parts.push(pageText);
  }
  await pdf.cleanup();
  await pdf.destroy();
  return parts.join("\n\n");
}

async function extractDocx(path: string): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path });
  return result.value.trim();
}

export async function extractText(path: string): Promise<ExtractResult> {
  let head: Buffer;
  try {
    const fd = await readFile(path);
    head = fd.subarray(0, 8);
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      detail: err instanceof Error ? err.message : "read failed",
    };
  }

  const format = detectFormat(head);
  if (!format) return { ok: false, reason: "unsupported" };

  try {
    const raw = format === "pdf" ? await extractPdf(path) : await extractDocx(path);
    if (!raw.trim()) return { ok: false, reason: "empty" };
    const { text, truncated } = truncate(raw);
    return { ok: true, value: { text, truncated, format } };
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      detail: err instanceof Error ? err.message : "extraction failed",
    };
  }
}
