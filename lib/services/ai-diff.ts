import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { extractText } from "@/lib/services/text-extract";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 60_000;
const MAX_SUMMARY_TOKENS = 1024;

const SYSTEM_PROMPT = `You are reviewing two versions of an investor-portal document for the AROMARIA Investor Portal. The reader is a non-lawyer board member who wants the gist of what changed between versions, not a redline.

Output strict JSON with this shape and nothing else:

{
  "headline": string,                     // one sentence, <= 140 chars
  "added": string[],                      // new content / additions
  "removed": string[],                    // content removed
  "modified": string[],                   // changed wording / numbers / dates
  "open_questions": string[]              // questions / suggestions / comments from the reviewer
}

Rules:
- Every array entry is a short bullet (one sentence, no markdown).
- Empty arrays are fine. Never include filler like "no changes".
- Quote specific numbers, dates, names, clause labels when present.
- If a section was reordered without content change, do NOT list it.
- Be terse. Aim for under 12 total bullets across all arrays.`;

const userPrompt = (
  fromVersion: number,
  fromText: string,
  fromTruncated: boolean,
  toVersion: number,
  toText: string,
  toTruncated: boolean,
) => `=== VERSION ${fromVersion} (previous)${fromTruncated ? " [truncated]" : ""} ===
${fromText}

=== VERSION ${toVersion} (new)${toTruncated ? " [truncated]" : ""} ===
${toText}`;

type DiffOutcome =
  | "done"
  | "error"
  | "unsupported"
  | "skipped_v1"
  | "skipped_quota";

function dailyCap(): number {
  const raw = process.env.AI_DIFF_DAILY_CAP;
  if (!raw) return 200;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 200;
}

async function withinDailyCap(): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.auditLog.count({
    where: {
      action: { in: ["AI_DIFF_DONE", "AI_DIFF_ERROR"] },
      createdAt: { gte: since },
    },
  });
  return count < dailyCap();
}

function stripJsonFences(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  return trimmed;
}

export async function runDiff(fileId: string): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const record = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    include: { previousVersion: true },
  });
  if (!record) return;

  if (!record.previousVersionId || !record.previousVersion) {
    await markStatus(fileId, "skipped_v1");
    return;
  }

  if (!apiKey) {
    await markStatus(fileId, "error", { error: "ANTHROPIC_API_KEY not set" });
    await writeAudit({
      userId: record.userId,
      deliverableId: record.deliverableId ?? undefined,
      action: "AI_DIFF_ERROR",
      entityType: "FileUpload",
      entityId: fileId,
      metadata: { error: "missing_api_key" },
    });
    return;
  }

  if (!(await withinDailyCap())) {
    await markStatus(fileId, "skipped_quota");
    return;
  }

  const prevStorage = storagePathFor(record.previousVersion.id);
  const curStorage = storagePathFor(record.id);

  const [prev, cur] = await Promise.all([
    extractText(prevStorage),
    extractText(curStorage),
  ]);

  if (prev.ok !== true || cur.ok !== true) {
    const reason =
      prev.ok === false ? prev.reason : cur.ok === false ? cur.reason : "error";
    if (reason === "unsupported" || reason === "empty") {
      await markStatus(fileId, "unsupported");
      return;
    }
    await markStatus(fileId, "error", {
      error: prev.ok === false ? prev.detail : (cur as { detail?: string }).detail,
    });
    return;
  }

  try {
    const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS });
    const response = await client.messages.create({
      model,
      max_tokens: MAX_SUMMARY_TOKENS,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: userPrompt(
            record.previousVersion.version,
            prev.value.text,
            prev.value.truncated,
            record.version,
            cur.value.text,
            cur.value.truncated,
          ),
        },
      ],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const summary = stripJsonFences(raw);

    await prisma.fileUpload.update({
      where: { id: fileId },
      data: {
        aiDiffStatus: "done",
        aiDiffSummary: summary,
        aiDiffError: null,
        aiDiffModel: model,
        aiDiffTokensIn: response.usage.input_tokens,
        aiDiffTokensOut: response.usage.output_tokens,
      },
    });

    await writeAudit({
      userId: record.userId,
      deliverableId: record.deliverableId ?? undefined,
      action: "AI_DIFF_DONE",
      entityType: "FileUpload",
      entityId: fileId,
      metadata: {
        model,
        tokensIn: response.usage.input_tokens,
        tokensOut: response.usage.output_tokens,
        previousVersionId: record.previousVersionId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI diff failed";
    await markStatus(fileId, "error", { error: message });
    await writeAudit({
      userId: record.userId,
      deliverableId: record.deliverableId ?? undefined,
      action: "AI_DIFF_ERROR",
      entityType: "FileUpload",
      entityId: fileId,
      metadata: { error: message.slice(0, 500) },
    });
  }
}

function storagePathFor(id: string): string {
  const dir =
    process.env.UPLOAD_DIR ?? `${process.cwd()}/.uploads`;
  return `${dir}/${id}.bin`;
}

async function markStatus(
  fileId: string,
  status: DiffOutcome,
  extra?: { error?: string },
) {
  await prisma.fileUpload.update({
    where: { id: fileId },
    data: {
      aiDiffStatus: status,
      aiDiffError: extra?.error ?? null,
    },
  });
}
