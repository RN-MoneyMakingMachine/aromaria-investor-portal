"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/session";
import { bulkCreateAdoptionSteps } from "@/lib/services/adoption";

export type BulkImportFormState =
  | { kind: "idle" }
  | { kind: "error"; error: string }
  | { kind: "ok"; created: number; skipped: number; deliverableName: string };

export async function bulkImportAdoptionStepsAction(
  _prev: BulkImportFormState,
  formData: FormData,
): Promise<BulkImportFormState> {
  const user = await requireUser();

  const deliverableId = String(formData.get("deliverableId") ?? "").trim();
  const raw = String(formData.get("steps") ?? "");
  const redirectAfter = formData.get("redirectAfter") === "on";

  if (!deliverableId) {
    return { kind: "error", error: "Pick a deliverable first." };
  }
  const titles = raw.split(/\r?\n/);
  const result = await bulkCreateAdoptionSteps(
    { kind: "user", user },
    deliverableId,
    titles,
  );
  if (!result.ok) {
    return { kind: "error", error: result.error };
  }

  revalidatePath(`/deliverables/item/${result.deliverableId}`);

  if (redirectAfter) {
    redirect(`/deliverables/item/${result.deliverableId}`);
  }

  return {
    kind: "ok",
    created: result.created,
    skipped: result.skipped,
    deliverableName: result.deliverableName,
  };
}
