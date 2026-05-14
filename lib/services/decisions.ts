import "server-only";

import type { DecisionStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";
import { canEdit } from "@/lib/rbac";

export type CreateDecisionInput = {
  title: string;
  summary: string;
  body?: string;
  status?: DecisionStatus;
};

export type UpdateDecisionInput = Partial<{
  title: string;
  summary: string;
  body: string;
  status: DecisionStatus;
}>;

export type DecisionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function listDecisions() {
  return prisma.decision.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function getDecision(id: string) {
  return prisma.decision.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, title: true } },
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
      decidedAt,
      createdById: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "DECISION_CREATED",
    entityType: "Decision",
    entityId: created.id,
    metadata: { status },
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
  if (patch.body !== undefined) data.body = patch.body.trim() || null;
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
