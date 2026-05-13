import "server-only";

import type { Category, Phase } from "@prisma/client";

import { prisma } from "@/lib/db";

export type ProgressMetric = {
  completed: number;
  total: number;
  percent: number;
};

export type DeliverableMetrics = {
  wire: ProgressMetric;
  committed: ProgressMetric;
  postSigning: ProgressMetric;
  completedPre60D: ProgressMetric;
  overall: ProgressMetric;
};

function bucket(
  items: { phase: Phase; status: string }[],
  phase: Phase,
): ProgressMetric {
  const inPhase = items.filter((d) => d.phase === phase);
  const completed = inPhase.filter((d) => d.status === "COMPLETED").length;
  const total = inPhase.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export async function getDeliverableMetrics(): Promise<DeliverableMetrics> {
  const all = await prisma.deliverable.findMany({
    select: { phase: true, status: true },
  });

  const wire = bucket(all, "WIRE_CONDITION");
  const committed = bucket(all, "COMMITTED");
  const postSigning = bucket(all, "POST_SIGNING");
  const completedPre60D = bucket(all, "COMPLETED_PRE_60D");

  const weightedCompleted =
    wire.completed * 3 +
    committed.completed * 2 +
    postSigning.completed * 2 +
    completedPre60D.completed * 1;
  const weightedTotal =
    wire.total * 3 +
    committed.total * 2 +
    postSigning.total * 2 +
    completedPre60D.total * 1;

  const overallCompleted =
    wire.completed +
    committed.completed +
    postSigning.completed +
    completedPre60D.completed;
  const overallTotal =
    wire.total + committed.total + postSigning.total + completedPre60D.total;

  return {
    wire,
    committed,
    postSigning,
    completedPre60D,
    overall: {
      completed: overallCompleted,
      total: overallTotal,
      percent:
        weightedTotal === 0
          ? 0
          : Math.round((weightedCompleted / weightedTotal) * 100),
    },
  };
}

export type CategorySummary = {
  category: Category;
  total: number;
  completed: number;
  percent: number;
};

export async function getCategorySummaries(): Promise<CategorySummary[]> {
  const all = await prisma.deliverable.findMany({
    select: { category: true, status: true },
  });

  const map = new Map<Category, { total: number; completed: number }>();
  for (const d of all) {
    const existing = map.get(d.category) ?? { total: 0, completed: 0 };
    existing.total += 1;
    if (d.status === "COMPLETED") existing.completed += 1;
    map.set(d.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      total: v.total,
      completed: v.completed,
      percent: v.total === 0 ? 0 : Math.round((v.completed / v.total) * 100),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export type PhaseSummary = {
  phase: Phase;
  total: number;
  completed: number;
  percent: number;
};

const PHASE_ORDER: Phase[] = [
  "WIRE_CONDITION",
  "COMMITTED",
  "POST_SIGNING",
  "COMPLETED_PRE_60D",
];

export async function getPhaseSummaries(): Promise<PhaseSummary[]> {
  const all = await prisma.deliverable.findMany({
    select: { phase: true, status: true },
  });

  return PHASE_ORDER.map((phase) => {
    const items = all.filter((d) => d.phase === phase);
    const completed = items.filter((d) => d.status === "COMPLETED").length;
    return {
      phase,
      total: items.length,
      completed,
      percent:
        items.length === 0 ? 0 : Math.round((completed / items.length) * 100),
    };
  });
}

export async function listDeliverablesByCategory(category: Category) {
  return prisma.deliverable.findMany({
    where: { category },
    orderBy: [{ phase: "asc" }, { code: "asc" }],
    include: {
      approvals: {
        select: { side: true, approvedAt: true, user: { select: { name: true } } },
      },
      _count: {
        select: { files: true, comments: true },
      },
    },
  });
}

export async function listDeliverablesByPhase(phase: Phase) {
  return prisma.deliverable.findMany({
    where: { phase },
    orderBy: { code: "asc" },
    include: {
      approvals: {
        select: { side: true, approvedAt: true, user: { select: { name: true } } },
      },
      _count: {
        select: { files: true, comments: true },
      },
    },
  });
}

export async function getDeliverable(id: string) {
  return prisma.deliverable.findUnique({
    where: { id },
    include: {
      approvals: {
        include: { user: { select: { name: true, email: true, side: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              side: true,
              role: true,
              title: true,
            },
          },
        },
      },
      auditEvents: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      },
      _count: { select: { files: true, comments: true } },
    },
  });
}
