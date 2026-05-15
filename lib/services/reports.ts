import "server-only";

import type { ReportType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { canEdit, isNikaidoFamilyMember, isOmoyInvestor, type SessionUser } from "@/lib/rbac";

export type CreateReportInput = {
  title: string;
  type: ReportType;
  periodLabel: string;
  summary?: string;
};

export type UpdateReportInput = Partial<CreateReportInput>;

export type ReportResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function listReports() {
  return prisma.report.findMany({
    orderBy: { publishedAt: "desc" },
    include: { _count: { select: { files: true } } },
  });
}

export async function getReport(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: { _count: { select: { files: true } } },
  });
}

export async function createReport(
  user: SessionUser,
  input: CreateReportInput,
): Promise<ReportResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to create reports." };
  }

  const title = input.title.trim();
  const periodLabel = input.periodLabel.trim();
  if (!title) return { ok: false, error: "Title is required." };
  if (!periodLabel) return { ok: false, error: "Period label is required." };

  const summary = input.summary?.trim() || null;

  const created = await prisma.report.create({
    data: {
      title,
      type: input.type,
      periodLabel,
      summary,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "REPORT_CREATED",
    entityType: "Report",
    entityId: created.id,
    metadata: { type: input.type, periodLabel },
  });

  return { ok: true, id: created.id };
}

export async function updateReport(
  user: SessionUser,
  id: string,
  patch: UpdateReportInput,
): Promise<ReportResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to edit reports." };
  }

  const existing = await prisma.report.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Report not found." };

  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.type !== undefined) data.type = patch.type;
  if (patch.periodLabel !== undefined)
    data.periodLabel = patch.periodLabel.trim();
  if (patch.summary !== undefined) data.summary = patch.summary.trim() || null;

  await prisma.report.update({ where: { id }, data });

  await writeAudit({
    userId: user.id,
    action: "REPORT_UPDATED",
    entityType: "Report",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return { ok: true, id };
}

export async function acknowledgeReport(
  user: SessionUser,
  id: string,
): Promise<ReportResult> {
  if (!isNikaidoFamilyMember(user) && !isOmoyInvestor(user)) {
    return {
      ok: false,
      error: "Only Nikaido family or Omoy investors can acknowledge reports.",
    };
  }
  const existing = await prisma.report.findUnique({
    where: { id },
    select: { id: true, acknowledgedAt: true },
  });
  if (!existing) return { ok: false, error: "Report not found." };
  if (existing.acknowledgedAt) return { ok: true, id };

  await prisma.report.update({
    where: { id },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: user.id,
      status: "ACKNOWLEDGED",
    },
  });

  await writeAudit({
    userId: user.id,
    action: "REPORT_ACKNOWLEDGED",
    entityType: "Report",
    entityId: id,
  });

  return { ok: true, id };
}
