import "server-only";

import type { DecisionStatus, DecisionTier, DecisionZone } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { canEdit, isAdmin, type SessionUser } from "@/lib/rbac";

export type CreateDecisionInput = {
  title: string;
  summary: string;
  body?: string;
  status?: DecisionStatus;
  zone?: DecisionZone | null;
  tier?: DecisionTier | null;
  ownerId?: string | null;
  targetCompletionDate?: Date | null;
};

export type UpdateDecisionInput = Partial<CreateDecisionInput>;

export type DecisionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function listDecisions() {
  return prisma.decision.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });
}

export async function getDecision(id: string) {
  return prisma.decision.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, title: true } },
      owner: { select: { id: true, name: true, title: true } },
      prerequisites: {
        include: {
          prerequisite: {
            select: { id: true, title: true, status: true, zone: true },
          },
        },
      },
      dependents: {
        include: {
          dependent: {
            select: { id: true, title: true, status: true, zone: true },
          },
        },
      },
      retrospectives: {
        orderBy: { dayMark: "asc" },
        include: { recordedBy: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createDecision(
  user: SessionUser,
  input: CreateDecisionInput,
): Promise<DecisionResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to record decisions." };
  }

  const title = input.title.trim();
  const summary = input.summary.trim();
  if (!title) return { ok: false, error: "Title is required." };
  if (!summary) return { ok: false, error: "Summary is required." };

  const body = input.body?.trim() || null;
  const status = input.status ?? "OPEN";
  const decidedAt = status === "IMPLEMENTED" ? new Date() : null;

  const created = await prisma.decision.create({
    data: {
      title,
      summary,
      body,
      status,
      zone: input.zone ?? null,
      tier: input.tier ?? null,
      ownerId: input.ownerId ?? null,
      targetCompletionDate: input.targetCompletionDate ?? null,
      decidedAt,
      createdById: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "DECISION_CREATED",
    entityType: "Decision",
    entityId: created.id,
    metadata: { status, zone: input.zone ?? null, tier: input.tier ?? null },
  });

  return { ok: true, id: created.id };
}

export async function updateDecision(
  user: SessionUser,
  id: string,
  patch: UpdateDecisionInput,
): Promise<DecisionResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to edit decisions." };
  }

  const existing = await prisma.decision.findUnique({
    where: { id },
    select: { id: true, status: true, decidedAt: true },
  });
  if (!existing) return { ok: false, error: "Decision not found." };

  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.summary !== undefined) data.summary = patch.summary.trim();
  if (patch.body !== undefined) data.body = patch.body?.trim() || null;
  if (patch.zone !== undefined) data.zone = patch.zone;
  if (patch.tier !== undefined) data.tier = patch.tier;
  if (patch.ownerId !== undefined) data.ownerId = patch.ownerId;
  if (patch.targetCompletionDate !== undefined)
    data.targetCompletionDate = patch.targetCompletionDate;
  if (patch.status !== undefined) {
    data.status = patch.status;
    if (
      patch.status === "IMPLEMENTED" &&
      existing.status !== "IMPLEMENTED" &&
      !existing.decidedAt
    ) {
      data.decidedAt = new Date();
    }
  }

  await prisma.decision.update({ where: { id }, data });

  await writeAudit({
    userId: user.id,
    action: "DECISION_UPDATED",
    entityType: "Decision",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return { ok: true, id };
}

export async function addDecisionDependency(
  user: SessionUser,
  dependentId: string,
  prerequisiteId: string,
): Promise<DecisionResult> {
  if (!canEdit(user))
    return { ok: false, error: "You are not authorised to edit decisions." };
  if (dependentId === prerequisiteId)
    return { ok: false, error: "A decision cannot depend on itself." };

  // Avoid creating a cycle by walking dependency chain from prerequisite.
  const seen = new Set<string>();
  let frontier = [prerequisiteId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      if (id === dependentId) {
        return { ok: false, error: "That dependency would create a cycle." };
      }
      if (seen.has(id)) continue;
      seen.add(id);
      const upstream = await prisma.decisionDependency.findMany({
        where: { dependentId: id },
        select: { prerequisiteId: true },
      });
      next.push(...upstream.map((u) => u.prerequisiteId));
    }
    frontier = next;
  }

  try {
    const created = await prisma.decisionDependency.create({
      data: { dependentId, prerequisiteId },
    });
    await writeAudit({
      userId: user.id,
      action: "DECISION_DEPENDENCY_ADDED",
      entityType: "DecisionDependency",
      entityId: created.id,
      metadata: { dependentId, prerequisiteId },
    });
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Dependency already exists." };
  }
}

export async function removeDecisionDependency(
  user: SessionUser,
  dependencyId: string,
): Promise<DecisionResult> {
  if (!canEdit(user))
    return { ok: false, error: "You are not authorised to edit decisions." };
  const existing = await prisma.decisionDependency.findUnique({
    where: { id: dependencyId },
    select: { id: true, dependentId: true, prerequisiteId: true },
  });
  if (!existing) return { ok: false, error: "Dependency not found." };
  await prisma.decisionDependency.delete({ where: { id: dependencyId } });
  await writeAudit({
    userId: user.id,
    action: "DECISION_DEPENDENCY_REMOVED",
    entityType: "DecisionDependency",
    entityId: existing.id,
    metadata: existing,
  });
  return { ok: true, id: existing.id };
}

export async function recordRetrospective(
  user: SessionUser,
  decisionId: string,
  dayMark: 30 | 60 | 90,
  content: string,
): Promise<DecisionResult> {
  if (!canEdit(user))
    return {
      ok: false,
      error: "You are not authorised to record retrospectives.",
    };
  const trimmed = content.trim();
  if (!trimmed)
    return { ok: false, error: "Retrospective content is required." };
  if (![30, 60, 90].includes(dayMark))
    return { ok: false, error: "Invalid day mark." };

  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    select: { id: true },
  });
  if (!decision) return { ok: false, error: "Decision not found." };

  const created = await prisma.decisionRetrospective.upsert({
    where: { decisionId_dayMark: { decisionId, dayMark } },
    update: { content: trimmed, recordedById: user.id, recordedAt: new Date() },
    create: { decisionId, dayMark, content: trimmed, recordedById: user.id },
  });

  await writeAudit({
    userId: user.id,
    action: "DECISION_RETROSPECTIVE_RECORDED",
    entityType: "DecisionRetrospective",
    entityId: created.id,
    metadata: { dayMark },
  });

  return { ok: true, id: created.id };
}

// Touch isAdmin to keep the import meaningful even if future scope adds
// admin-only operations here. (Type-only consumption avoided for tooling
// that strips unused identifiers.)
void isAdmin;
