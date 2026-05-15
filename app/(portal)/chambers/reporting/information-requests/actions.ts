"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/session";
import {
  acknowledgeInformationRequest,
  createInformationRequest,
  markInformationRequestDelivered,
} from "@/lib/services/information-requests";

export type IRFormState = {
  error?: string;
  subject?: string;
  body?: string;
  isSubstantive?: boolean;
};

export async function createInformationRequestAction(
  _prev: IRFormState,
  formData: FormData,
): Promise<IRFormState> {
  const user = await requireUser();
  const subject = String(formData.get("subject") ?? "");
  const body = String(formData.get("body") ?? "");
  const isSubstantive = formData.get("isSubstantive") === "on";

  const result = await createInformationRequest(user, {
    subject,
    body,
    isSubstantive,
  });
  if (!result.ok) {
    return { error: result.error, subject, body, isSubstantive };
  }

  revalidatePath("/chambers/reporting");
  revalidatePath("/chambers/reporting/information-requests");
  redirect("/chambers/reporting/information-requests");
}

export type IRSimpleResult = { ok: true } | { ok: false; error: string };

export async function acknowledgeInformationRequestAction(
  id: string,
): Promise<IRSimpleResult> {
  const user = await requireUser();
  const r = await acknowledgeInformationRequest(user, id);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/chambers/reporting");
  revalidatePath("/chambers/reporting/information-requests");
  return { ok: true };
}

export async function markInformationRequestDeliveredAction(
  id: string,
): Promise<IRSimpleResult> {
  const user = await requireUser();
  const r = await markInformationRequestDelivered(user, id);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/chambers/reporting");
  revalidatePath("/chambers/reporting/information-requests");
  return { ok: true };
}
