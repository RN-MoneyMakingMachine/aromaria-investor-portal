import "server-only";

import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { isAdmin, type SessionUser } from "@/lib/rbac";

export type InformationRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function startOfQuarter(d: Date): Date {
  const month = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), month, 1);
}

function endOfQuarter(d: Date): Date {
  const month = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), month + 3, 0, 23, 59, 59, 999);
}

export async function listInformationRequests(limit = 50) {
  return prisma.informationRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { author: { select: { id: true, name: true, side: true } } },
  });
}

export async function getQuarterlySubstantiveCount(
  now: Date = new Date(),
): Promise<{ used: number; cap: number; quarterLabel: string }> {
  const qStart = startOfQuarter(now);
  const qEnd = endOfQuarter(now);
  const used = await prisma.informationRequest.count({
    where: {
      isSubstantive: true,
      createdAt: { gte: qStart, lte: qEnd },
    },
  });
  const quarterLabel = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
  return { used, cap: 4, quarterLabel };
}

export async function createInformationRequest(
  user: SessionUser,
  input: { subject: string; body: string; isSubstantive: boolean },
): Promise<InformationRequestResult> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) return { ok: false, error: "Subject is required." };
  if (!body) return { ok: false, error: "Body is required." };
  if (subject.length > 200)
    return { ok: false, error: "Subject too long (max 200 chars)." };

  const created = await prisma.informationRequest.create({
    data: {
      subject,
      body,
      isSubstantive: input.isSubstantive,
      authorId: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "INFORMATION_REQUEST_CREATED",
    entityType: "InformationRequest",
    entityId: created.id,
    metadata: { subject, isSubstantive: input.isSubstantive },
  });

  return { ok: true, id: created.id };
}

export async function acknowledgeInformationRequest(
  user: SessionUser,
  id: string,
): Promise<InformationRequestResult> {
  if (!isAdmin(user))
    return { ok: false, error: "Only admins can acknowledge requests.", };
  const existing = await prisma.informationRequest.findUnique({
    where: { id },
    select: { id: true, acknowledgedAt: true },
  });
  if (!existing) return { ok: false, error: "Request not found." };
  if (existing.acknowledgedAt) return { ok: true, id };

  await prisma.informationRequest.update({
    where: { id },
    data: { acknowledgedAt: new Date(), status: "ACKNOWLEDGED" },
  });

  await writeAudit({
    userId: user.id,
    action: "INFORMATION_REQUEST_ACKNOWLEDGED",
    entityType: "InformationRequest",
    entityId: id,
  });

  return { ok: true, id };
}

export async function markInformationRequestDelivered(
  user: SessionUser,
  id: string,
): Promise<InformationRequestResult> {
  if (!isAdmin(user))
    return { ok: false, error: "Only admins can mark delivered." };
  const existing = await prisma.informationRequest.findUnique({
    where: { id },
    select: { id: true, deliveredAt: true, acknowledgedAt: true },
  });
  if (!existing) return { ok: false, error: "Request not found." };

  await prisma.informationRequest.update({
    where: { id },
    data: {
      deliveredAt: new Date(),
      acknowledgedAt: existing.acknowledgedAt ?? new Date(),
      status: "DELIVERED",
    },
  });

  await writeAudit({
    userId: user.id,
    action: "INFORMATION_REQUEST_DELIVERED",
    entityType: "InformationRequest",
    entityId: id,
  });

  return { ok: true, id };
}
