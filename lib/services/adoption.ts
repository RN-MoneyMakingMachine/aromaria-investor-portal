import "server-only";

import { writeAudit } from "@/lib/audit";
import { getAdoptionSteps } from "@/lib/data/adoption-steps";
import { prisma } from "@/lib/db";
import { isAdmin, type SessionUser } from "@/lib/rbac";

export type AdoptionStepView = {
  index: number;
  title: string;
  completedAt: Date | null;
  completedBy: { id: string; name: string } | null;
};

export async function listAdoptionSteps(
  deliverableId: string,
  deliverableCode: string,
): Promise<AdoptionStepView[]> {
  const definitions = getAdoptionSteps(deliverableCode);
  if (definitions.length === 0) return [];

  const completions = await prisma.adoptionStepCompletion.findMany({
    where: { deliverableId },
    include: { completedBy: { select: { id: true, name: true } } },
  });
  const byIndex = new Map(completions.map((c) => [c.stepIndex, c]));

  return definitions.map((title, index) => {
    const c = byIndex.get(index);
    return {
      index,
      title,
      completedAt: c?.completedAt ?? null,
      completedBy: c?.completedBy ?? null,
    };
  });
}

export type ToggleResult =
  | { ok: true; deliverableId: string }
  | { ok: false; error: string; status: number };

export async function toggleAdoptionStep(
  user: SessionUser,
  deliverableId: string,
  stepIndex: number,
): Promise<ToggleResult> {
  if (!isAdmin(user)) {
    return {
      ok: false,
      error: "Only admins can change the adoption checklist.",
      status: 403,
    };
  }
  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    return { ok: false, error: "Invalid step index.", status: 400 };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, code: true },
  });
  if (!deliverable) {
    return { ok: false, error: "Deliverable not found.", status: 404 };
  }
  const steps = getAdoptionSteps(deliverable.code);
  if (stepIndex >= steps.length) {
    return { ok: false, error: "Step index out of range.", status: 400 };
  }

  const existing = await prisma.adoptionStepCompletion.findUnique({
    where: {
      deliverableId_stepIndex: { deliverableId, stepIndex },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.adoptionStepCompletion.delete({ where: { id: existing.id } });
    await writeAudit({
      userId: user.id,
      deliverableId,
      action: "ADOPTION_STEP_UNCHECKED",
      entityType: "AdoptionStepCompletion",
      entityId: existing.id,
      metadata: { stepIndex, title: steps[stepIndex] },
    });
  } else {
    const created = await prisma.adoptionStepCompletion.create({
      data: {
        deliverableId,
        stepIndex,
        completedById: user.id,
      },
    });
    await writeAudit({
      userId: user.id,
      deliverableId,
      action: "ADOPTION_STEP_CHECKED",
      entityType: "AdoptionStepCompletion",
      entityId: created.id,
      metadata: { stepIndex, title: steps[stepIndex] },
    });
  }

  return { ok: true, deliverableId };
}
