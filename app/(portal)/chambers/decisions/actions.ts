"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { DecisionStatus } from "@prisma/client";

import { requireUser } from "@/lib/session";
import { createDecision } from "@/lib/services/decisions";

export type DecisionFormState = {
  error?: string;
  title?: string;
  summary?: string;
  body?: string;
  status?: string;
};

const DECISION_STATUSES: DecisionStatus[] = [
  "OPEN",
  "APPROVED",
  "DECLINED",
  "IMPLEMENTED",
];

export async function createDecisionAction(
  _prev: DecisionFormState,
  formData: FormData,
): Promise<DecisionFormState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const body = String(formData.get("body") ?? "");
  const statusRaw = String(formData.get("status") ?? "OPEN");

  if (!DECISION_STATUSES.includes(statusRaw as DecisionStatus)) {
    return {
      error: "Select a valid status.",
      title,
      summary,
      body,
      status: statusRaw,
    };
  }

  const result = await createDecision(user, {
    title,
    summary,
    body,
    status: statusRaw as DecisionStatus,
  });

  if (!result.ok) {
    return { error: result.error, title, summary, body, status: statusRaw };
  }

  revalidatePath("/chambers/decisions");
  redirect(`/chambers/decisions/${result.id}`);
}
