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

type ProgressRow = { phase: Phase; status: string; progressPercent: number };

function bucket(items: ProgressRow[], phase: Phase): ProgressMetric {
  const inPhase = items.filter((d) => d.phase === phase);
  const total = inPhase.length;
  const completed = inPhase.filter((d) => d.status === "COMPLETED").length;
  const sum = inPhase.reduce((acc, d) => acc + d.progressPercent, 0);
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round(sum / total),
  };
}

export async function getDeliverableMetrics(): Promise<DeliverableMetrics> {
  const all = await prisma.deliverable.findMany({
    select: { phase: true, status: true, progressPercent: true },
  });

  const wire = bucket(all, "WIRE_CONDITION");
  const committed = bucket(all, "COMMITTED");
  const postSigning = bucket(all, "POST_SIGNING");
  const completedPre60D = bucket(all, "COMPLETED_PRE_60D");

  // Weighted overall progress: each phase's average progressPercent is
  // weighted by its strategic priority. WIRE_CONDITION items count 3x,
  // COMMITTED + POST_SIGNING 2x, the historical "pre-60-day" bucket 1x.
  const weights = {
    wire: 3,
    committed: 2,
    postSigning: 2,
    completedPre60D: 1,
  } as const;
  const weightedSum =
    wire.percent * wire.total * weights.wire +
    committed.percent * committed.total * weights.committed +
    postSigning.percent * postSigning.total * weights.postSigning +
    completedPre60D.percent * completedPre60D.total * weights.completedPre60D;
  const weightedMax =
    wire.total * weights.wire * 100 +
    committed.total * weights.committed * 100 +
    postSigning.total * weights.postSigning * 100 +
    completedPre60D.total * weights.completedPre60D * 100;

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
      percent: weightedMax === 0 ? 0 : Math.round(weightedSum / weightedMax * 100),
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
    select: { category: true, status: true, progressPercent: true },
  });

  const map = new Map<
    Category,
    { total: number; completed: number; progressSum: number }
  >();
  for (const d of all) {
    const existing =
      map.get(d.category) ?? { total: 0, completed: 0, progressSum: 0 };
    existing.total += 1;
    existing.progressSum += d.progressPercent;
    if (d.status === "COMPLETED") existing.completed += 1;
    map.set(d.category, existing);
  }

  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      total: v.total,
      completed: v.completed,
      percent: v.total === 0 ? 0 : Math.round(v.progressSum / v.total),
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
    select: { phase: true, status: true, progressPercent: true },
  });

  return PHASE_ORDER.map((phase) => {
    const items = all.filter((d) => d.phase === phase);
    const total = items.length;
    const completed = items.filter((d) => d.status === "COMPLETED").length;
    const sum = items.reduce((acc, d) => acc + d.progressPercent, 0);
    return {
      phase,
      total,
      completed,
      percent: total === 0 ? 0 : Math.round(sum / total),
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
