import "server-only";

import type {
  AgendaItemType,
  ResolutionThresholdType,
  RsvpStatus,
  VoteChoice,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { canEdit, isAdmin, type SessionUser } from "@/lib/rbac";

export type Result<T = string> =
  | { ok: true; id: T }
  | { ok: false; error: string };

/* ───────────── Agenda ───────────── */

export async function addAgendaItem(
  user: SessionUser,
  meetingId: string,
  input: {
    title: string;
    body?: string;
    leadPresenter?: string;
    timeMinutes?: number;
    itemType: AgendaItemType;
  },
): Promise<Result> {
  if (!canEdit(user))
    return { ok: false, error: "You are not authorised to edit the agenda." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };

  const meeting = await prisma.boardMeeting.findUnique({
    where: { id: meetingId },
    select: { id: true },
  });
  if (!meeting) return { ok: false, error: "Meeting not found." };

  const last = await prisma.agendaItem.findFirst({
    where: { meetingId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const created = await prisma.agendaItem.create({
    data: {
      meetingId,
      title,
      body: input.body?.trim() || null,
      leadPresenter: input.leadPresenter?.trim() || null,
      timeMinutes: input.timeMinutes ?? null,
      itemType: input.itemType,
      order: nextOrder,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "AGENDA_ITEM_ADDED",
    entityType: "AgendaItem",
    entityId: created.id,
    metadata: { meetingId, title, itemType: input.itemType },
  });

  return { ok: true, id: created.id };
}

export async function removeAgendaItem(
  user: SessionUser,
  itemId: string,
): Promise<Result> {
  if (!canEdit(user))
    return { ok: false, error: "You are not authorised to edit the agenda." };

  const existing = await prisma.agendaItem.findUnique({
    where: { id: itemId },
    select: { id: true, meetingId: true, title: true },
  });
  if (!existing) return { ok: false, error: "Agenda item not found." };

  await prisma.agendaItem.delete({ where: { id: itemId } });

  await writeAudit({
    userId: user.id,
    action: "AGENDA_ITEM_REMOVED",
    entityType: "AgendaItem",
    entityId: itemId,
    metadata: existing,
  });

  return { ok: true, id: itemId };
}

/* ───────────── RSVP / attendance ───────────── */

export async function recordRsvp(
  user: SessionUser,
  meetingId: string,
  status: RsvpStatus,
  note?: string,
): Promise<Result> {
  const meeting = await prisma.boardMeeting.findUnique({
    where: { id: meetingId },
    select: { id: true },
  });
  if (!meeting) return { ok: false, error: "Meeting not found." };

  const upserted = await prisma.meetingAttendance.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: {
      rsvpStatus: status,
      rsvpNote: note?.trim() || null,
      rsvpAt: new Date(),
    },
    create: {
      meetingId,
      userId: user.id,
      rsvpStatus: status,
      rsvpNote: note?.trim() || null,
      rsvpAt: new Date(),
    },
  });

  await writeAudit({
    userId: user.id,
    action: "RSVP_RECORDED",
    entityType: "MeetingAttendance",
    entityId: upserted.id,
    metadata: { meetingId, status },
  });

  return { ok: true, id: upserted.id };
}

/* ───────────── Meeting lifecycle ───────────── */

export async function startMeeting(
  user: SessionUser,
  meetingId: string,
): Promise<Result> {
  if (!canEdit(user))
    return { ok: false, error: "Only admins can start the meeting." };

  const existing = await prisma.boardMeeting.findUnique({
    where: { id: meetingId },
    select: { id: true, status: true },
  });
  if (!existing) return { ok: false, error: "Meeting not found." };
  if (existing.status === "IN_PROGRESS") return { ok: true, id: meetingId };
  if (existing.status === "COMPLETED" || existing.status === "MINUTES_APPROVED") {
    return { ok: false, error: "Meeting is already concluded." };
  }

  await prisma.boardMeeting.update({
    where: { id: meetingId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  await writeAudit({
    userId: user.id,
    action: "MEETING_STARTED",
    entityType: "BoardMeeting",
    entityId: meetingId,
  });

  return { ok: true, id: meetingId };
}

export async function endMeeting(
  user: SessionUser,
  meetingId: string,
): Promise<Result> {
  if (!canEdit(user))
    return { ok: false, error: "Only admins can end the meeting." };

  const existing = await prisma.boardMeeting.findUnique({
    where: { id: meetingId },
    select: { id: true, status: true },
  });
  if (!existing) return { ok: false, error: "Meeting not found." };
  if (existing.status !== "IN_PROGRESS") {
    return { ok: false, error: "Meeting is not in progress." };
  }

  await prisma.boardMeeting.update({
    where: { id: meetingId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  await writeAudit({
    userId: user.id,
    action: "MEETING_ENDED",
    entityType: "BoardMeeting",
    entityId: meetingId,
  });

  return { ok: true, id: meetingId };
}

/* ───────────── Resolutions + voting ───────────── */

const THRESHOLD_RULES: Record<
  ResolutionThresholdType,
  { eligibleSides: ("NIKAIDO" | "OMOY")[]; required: number; total: number; label: string }
> = {
  STANDARD:    { eligibleSides: ["NIKAIDO","OMOY"], required: 3, total: 5, label: "Board majority (3 of 5)" },
  TIER_2:      { eligibleSides: ["NIKAIDO","OMOY"], required: 4, total: 5, label: "Board supermajority (4 of 5)" },
  TIER_1:      { eligibleSides: ["NIKAIDO","OMOY"], required: 4, total: 5, label: "Board supermajority + Investor consent (Tier 1)" },
  FAMILY_ONLY: { eligibleSides: ["NIKAIDO"],       required: 3, total: 4, label: "Family directors (3 of 4)" },
};

export function thresholdLabel(type: ResolutionThresholdType): string {
  return THRESHOLD_RULES[type].label;
}
export function thresholdRequired(type: ResolutionThresholdType): { required: number; total: number } {
  return { required: THRESHOLD_RULES[type].required, total: THRESHOLD_RULES[type].total };
}

export async function createResolution(
  user: SessionUser,
  meetingId: string,
  input: {
    title: string;
    body: string;
    thresholdType: ResolutionThresholdType;
  },
): Promise<Result> {
  if (!canEdit(user))
    return { ok: false, error: "Only admins can create resolutions." };

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false, error: "Title is required." };
  if (!body) return { ok: false, error: "Body is required." };

  const meeting = await prisma.boardMeeting.findUnique({
    where: { id: meetingId },
    select: { id: true },
  });
  if (!meeting) return { ok: false, error: "Meeting not found." };

  const created = await prisma.boardResolution.create({
    data: {
      meetingId,
      title,
      body,
      thresholdType: input.thresholdType,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "RESOLUTION_CREATED",
    entityType: "BoardResolution",
    entityId: created.id,
    metadata: { meetingId, title, thresholdType: input.thresholdType },
  });

  return { ok: true, id: created.id };
}

export async function castVote(
  user: SessionUser,
  resolutionId: string,
  choice: VoteChoice,
  comment?: string,
): Promise<Result> {
  const resolution = await prisma.boardResolution.findUnique({
    where: { id: resolutionId },
    select: { id: true, meetingId: true, thresholdType: true, lockedAt: true },
  });
  if (!resolution) return { ok: false, error: "Resolution not found." };
  if (resolution.lockedAt)
    return { ok: false, error: "Resolution already concluded." };

  const rule = THRESHOLD_RULES[resolution.thresholdType];
  if (!rule.eligibleSides.includes(user.side as "NIKAIDO" | "OMOY")) {
    return {
      ok: false,
      error:
        "You are not eligible to vote on this resolution under its threshold rule.",
    };
  }
  if (user.role === "VIEWER") {
    return { ok: false, error: "Observers cannot cast votes." };
  }

  const upserted = await prisma.boardVote.upsert({
    where: { resolutionId_userId: { resolutionId, userId: user.id } },
    update: { choice, comment: comment?.trim() || null, castAt: new Date() },
    create: {
      resolutionId,
      userId: user.id,
      choice,
      comment: comment?.trim() || null,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "VOTE_CAST",
    entityType: "BoardVote",
    entityId: upserted.id,
    metadata: { resolutionId, choice },
  });

  return { ok: true, id: upserted.id };
}

export async function resolveResolution(
  user: SessionUser,
  resolutionId: string,
): Promise<Result> {
  if (!isAdmin(user))
    return { ok: false, error: "Only admins can finalise a resolution." };

  const resolution = await prisma.boardResolution.findUnique({
    where: { id: resolutionId },
    include: {
      votes: { select: { choice: true } },
    },
  });
  if (!resolution) return { ok: false, error: "Resolution not found." };
  if (resolution.lockedAt) return { ok: true, id: resolutionId };

  const rule = THRESHOLD_RULES[resolution.thresholdType];
  const forCount = resolution.votes.filter((v) => v.choice === "FOR").length;
  const passed = forCount >= rule.required;

  await prisma.boardResolution.update({
    where: { id: resolutionId },
    data: {
      outcome: passed ? "PASSED" : "FAILED",
      resolvedAt: new Date(),
      lockedAt: new Date(),
    },
  });

  await writeAudit({
    userId: user.id,
    action: "RESOLUTION_RESOLVED",
    entityType: "BoardResolution",
    entityId: resolutionId,
    metadata: {
      passed,
      forCount,
      required: rule.required,
    },
  });

  return { ok: true, id: resolutionId };
}

/* ───────────── Reads ───────────── */

export async function listMeetingsRich() {
  return prisma.boardMeeting.findMany({
    orderBy: [{ status: "desc" }, { meetingDate: "desc" }],
    include: {
      _count: { select: { agendaItems: true, resolutions: true, rsvps: true } },
    },
  });
}

export async function getMeetingFull(id: string) {
  return prisma.boardMeeting.findUnique({
    where: { id },
    include: {
      agendaItems: { orderBy: { order: "asc" } },
      rsvps: {
        include: {
          user: { select: { id: true, name: true, side: true, role: true, title: true } },
        },
      },
      resolutions: {
        orderBy: { createdAt: "asc" },
        include: {
          votes: {
            include: {
              user: { select: { id: true, name: true, side: true } },
            },
          },
        },
      },
    },
  });
}

export async function listEligibleDirectors() {
  return prisma.user.findMany({
    where: {
      side: { in: ["NIKAIDO", "OMOY"] },
      role: { not: "VIEWER" },
    },
    select: { id: true, name: true, side: true, role: true, title: true },
    orderBy: [{ side: "asc" }, { name: "asc" }],
  });
}
