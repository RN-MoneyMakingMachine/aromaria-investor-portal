import "server-only";

import { spawn } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { isPdfConvertible } from "@/lib/pdf-convertible";

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "application/vnd.oasis.opendocument.text": ".odt",
  "application/vnd.oasis.opendocument.spreadsheet": ".ods",
  "application/vnd.oasis.opendocument.presentation": ".odp",
  "text/rtf": ".rtf",
  "application/rtf": ".rtf",
  "text/plain": ".txt",
  "text/csv": ".csv",
};

const CONVERSION_TIMEOUT_MS = 60_000;
const SOFFICE_BIN = process.env.SOFFICE_BIN || "soffice";

export type PdfConvertResult =
  | { ok: true; bytes: Buffer }
  | { ok: false; error: string };

export async function convertOfficeFileToPdf(params: {
  sourcePath: string;
  mimeType: string;
  filename: string;
}): Promise<PdfConvertResult> {
  if (!isPdfConvertible(params.mimeType)) {
    return { ok: false, error: "This file type cannot be converted to PDF." };
  }

  const work = await mkdtemp(path.join(tmpdir(), "doc2pdf-"));
  try {
    const ext =
      EXTENSION_BY_MIME[params.mimeType] ||
      path.extname(params.filename) ||
      ".docx";
    const inputPath = path.join(work, `input${ext}`);
    await copyFile(params.sourcePath, inputPath);

    const exitInfo = await runSoffice(work, inputPath);
    if (exitInfo.code !== 0) {
      return {
        ok: false,
        error: `Conversion failed (soffice exit ${exitInfo.code}).`,
      };
    }

    const outputPath = path.join(work, "input.pdf");
    const bytes = await readFile(outputPath);
    return { ok: true, bytes };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Conversion failed.",
    };
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
}

type SofficeExit = { code: number; stderr: string };

function runSoffice(outDir: string, inputPath: string): Promise<SofficeExit> {
  return new Promise<SofficeExit>((resolve, reject) => {
    const proc = spawn(
      SOFFICE_BIN,
      [
        "--headless",
        "--norestore",
        "--nolockcheck",
        "--nodefault",
        "--nofirststartwizard",
        "--convert-to",
        "pdf",
        "--outdir",
        outDir,
        inputPath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    proc.stdout?.on("data", () => undefined);
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const killer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("Conversion timed out."));
    }, CONVERSION_TIMEOUT_MS);

    proc.on("error", (err) => {
      clearTimeout(killer);
      reject(err);
    });
    proc.on("close", (code) => {
      clearTimeout(killer);
      resolve({ code: code ?? -1, stderr });
    });
  });
}
