"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReportType } from "@prisma/client";

import { requireUser } from "@/lib/session";
import { createReport } from "@/lib/services/reports";

export type ReportFormState = {
  error?: string;
  title?: string;
  type?: string;
  periodLabel?: string;
  summary?: string;
};

const REPORT_TYPES: ReportType[] = [
  "FINANCIAL",
  "GROWTH",
  "CREATIVE",
  "SPECIAL_PROJECT",
];

export async function createReportAction(
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "");
  const typeRaw = String(formData.get("type") ?? "");
  const periodLabel = String(formData.get("periodLabel") ?? "");
  const summary = String(formData.get("summary") ?? "");

  if (!REPORT_TYPES.includes(typeRaw as ReportType)) {
    return {
      error: "Select a valid report type.",
      title,
      type: typeRaw,
      periodLabel,
      summary,
    };
  }

  const result = await createReport(user, {
    title,
    type: typeRaw as ReportType,
    periodLabel,
    summary,
  });

  if (!result.ok) {
    return { error: result.error, title, type: typeRaw, periodLabel, summary };
  }

  revalidatePath("/chambers/reporting");
  redirect(`/chambers/reporting/${result.id}`);
}
