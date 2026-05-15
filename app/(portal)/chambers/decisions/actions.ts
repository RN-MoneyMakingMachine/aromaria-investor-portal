"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type {
  DecisionStatus,
  DecisionTier,
  DecisionZone,
} from "@prisma/client";

import { requireUser } from "@/lib/session";
import {
  addDecisionDependency,
  createDecision,
  recordRetrospective,
  removeDecisionDependency,
} from "@/lib/services/decisions";

export type DecisionFormState = {
  error?: string;
  title?: string;
  summary?: string;
  body?: string;
  status?: string;
  zone?: string;
  tier?: string;
  ownerId?: string;
  targetCompletionDate?: string;
};

const DECISION_STATUSES: DecisionStatus[] = [
  "OPEN",
  "APPROVED",
  "DECLINED",
  "IMPLEMENTED",
];

const DECISION_ZONES: DecisionZone[] = [
  "ZONE_1",
  "ZONE_2",
  "ZONE_3",
  "ZONE_4",
  "EMERGENCY",
  "THRESHOLD",
];

const DECISION_TIERS: DecisionTier[] = ["TIER_1", "TIER_2"];

export async function createDecisionAction(
  _prev: DecisionFormState,
  formData: FormData,
): Promise<DecisionFormState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "");
  const summary = String(formData.get("summary") ?? "");
  const body = String(formData.get("body") ?? "");
  const statusRaw = String(formData.get("status") ?? "OPEN");
  const zoneRaw = String(formData.get("zone") ?? "");
  const tierRaw = String(formData.get("tier") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "") || null;
  const targetRaw = String(formData.get("targetCompletionDate") ?? "");

  if (!DECISION_STATUSES.includes(statusRaw as DecisionStatus)) {
    return {
      error: "Select a valid status.",
      title,
      summary,
      body,
      status: statusRaw,
      zone: zoneRaw,
      tier: tierRaw,
      ownerId: ownerId ?? "",
      targetCompletionDate: targetRaw,
    };
  }

  const zone =
    zoneRaw && DECISION_ZONES.includes(zoneRaw as DecisionZone)
      ? (zoneRaw as DecisionZone)
      : null;
  const tier =
    tierRaw && DECISION_TIERS.includes(tierRaw as DecisionTier)
      ? (tierRaw as DecisionTier)
      : null;
  const targetCompletionDate = targetRaw ? new Date(targetRaw) : null;

  const result = await createDecision(user, {
    title,
    summary,
    body,
    status: statusRaw as DecisionStatus,
    zone,
    tier,
    ownerId,
    targetCompletionDate,
  });

  if (!result.ok) {
    return {
      error: result.error,
      title,
      summary,
      body,
      status: statusRaw,
      zone: zoneRaw,
      tier: tierRaw,
      ownerId: ownerId ?? "",
      targetCompletionDate: targetRaw,
    };
  }

  revalidatePath("/chambers/decisions");
  redirect(`/chambers/decisions/${result.id}`);
}

export type DependencyResult = { ok: true } | { ok: false; error: string };

export async function addDependencyAction(
  dependentId: string,
  prerequisiteId: string,
): Promise<DependencyResult> {
  const user = await requireUser();
  const r = await addDecisionDependency(user, dependentId, prerequisiteId);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/chambers/decisions/${dependentId}`);
  revalidatePath(`/chambers/decisions/${prerequisiteId}`);
  revalidatePath("/chambers/decisions");
  return { ok: true };
}

export async function removeDependencyAction(
  dependencyId: string,
): Promise<DependencyResult> {
  const user = await requireUser();
  const r = await removeDecisionDependency(user, dependencyId);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/chambers/decisions");
  return { ok: true };
}

export type RetroResult = { ok: true } | { ok: false; error: string };

export async function recordRetrospectiveAction(
  decisionId: string,
  dayMark: number,
  content: string,
): Promise<RetroResult> {
  const user = await requireUser();
  if (dayMark !== 30 && dayMark !== 60 && dayMark !== 90) {
    return { ok: false, error: "Invalid day mark." };
  }
  const r = await recordRetrospective(user, decisionId, dayMark, content);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/chambers/decisions/${decisionId}`);
  return { ok: true };
}
