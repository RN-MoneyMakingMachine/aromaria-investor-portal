import "server-only";

import { getAdoptionSteps } from "@/lib/data/adoption-steps";
import { prisma } from "@/lib/db";
import { listAdoptionSteps, type AdoptionStepView } from "@/lib/services/adoption";

export const GOVERNANCE_DOCUMENTS = [
  { code: "PR-16", section: "Section 3(a)", short: "Corporate Governance Framework" },
  { code: "PR-17", section: "Section 3(b)", short: "Authority Matrix" },
  { code: "PR-18", section: "Section 3(c)", short: "Travel Policy" },
  { code: "PR-19", section: "Section 3(d)", short: "Reporting Policy" },
  { code: "PR-20", section: "Section 3(e)", short: "Related Party & Anti-Corruption Policy" },
  { code: "WC-01", section: "Interim", short: "Unanimous Decisions — Interim Protocol" },
  { code: "PR-21", section: "Section 6(a)", short: "Breach Mechanics Framework" },
  { code: "CM-07", section: "IT", short: "IT Policy" },
] as const;

export type GovernanceDocumentCode =
  (typeof GOVERNANCE_DOCUMENTS)[number]["code"];

export type GovernanceDocumentSummary = {
  code: string;
  section: string;
  short: string;
  deliverableId: string;
  deliverableName: string;
  total: number;
  completed: number;
};

export async function listGovernanceDocuments(): Promise<
  GovernanceDocumentSummary[]
> {
  const codes = GOVERNANCE_DOCUMENTS.map((d) => d.code);
  const deliverables = await prisma.deliverable.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true, name: true },
  });
  const byCode = new Map(deliverables.map((d) => [d.code, d]));

  const completions = await prisma.adoptionStepCompletion.groupBy({
    by: ["deliverableId"],
    _count: { _all: true },
    where: { deliverableId: { in: deliverables.map((d) => d.id) } },
  });
  const completedByDeliverableId = new Map(
    completions.map((c) => [c.deliverableId, c._count._all]),
  );

  return GOVERNANCE_DOCUMENTS.map((d) => {
    const deliverable = byCode.get(d.code);
    const total = getAdoptionSteps(d.code).length;
    const completed = deliverable
      ? completedByDeliverableId.get(deliverable.id) ?? 0
      : 0;
    return {
      code: d.code,
      section: d.section,
      short: d.short,
      deliverableId: deliverable?.id ?? "",
      deliverableName: deliverable?.name ?? d.short,
      total,
      completed: Math.min(completed, total),
    };
  });
}

export type GovernanceDocumentDetail = {
  code: string;
  section: string;
  short: string;
  deliverableId: string;
  deliverableName: string;
  description: string;
  steps: AdoptionStepView[];
};

export async function getGovernanceDocument(
  code: string,
): Promise<GovernanceDocumentDetail | null> {
  const meta = GOVERNANCE_DOCUMENTS.find((d) => d.code === code);
  if (!meta) return null;

  const deliverable = await prisma.deliverable.findUnique({
    where: { code: meta.code },
    select: { id: true, name: true, description: true },
  });
  if (!deliverable) return null;

  const steps = await listAdoptionSteps(deliverable.id, meta.code);

  return {
    code: meta.code,
    section: meta.section,
    short: meta.short,
    deliverableId: deliverable.id,
    deliverableName: deliverable.name,
    description: deliverable.description,
    steps,
  };
}
