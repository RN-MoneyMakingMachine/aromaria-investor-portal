import "server-only";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";
import { canEdit } from "@/lib/rbac";

export type CreateMeetingInput = {
  title: string;
  meetingDate: Date;
  agenda?: string;
  attendees: string[];
};

export type UpdateMeetingInput = Partial<{
  title: string;
  meetingDate: Date;
  agenda: string;
  minutes: string;
  decisions: string;
  attendees: string[];
}>;

export type MeetingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function listMeetings() {
  return prisma.boardMeeting.findMany({
    orderBy: { meetingDate: "desc" },
  });
}

export async function getMeeting(id: string) {
  return prisma.boardMeeting.findUnique({ where: { id } });
}

export async function createMeeting(
  user: SessionUser,
  input: CreateMeetingInput,
): Promise<MeetingResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to schedule meetings." };
  }

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Title is required." };
  if (Number.isNaN(input.meetingDate.getTime())) {
    return { ok: false, error: "Meeting date is required." };
  }

  const attendees = input.attendees.map((a) => a.trim()).filter(Boolean);
  const agenda = input.agenda?.trim() || null;

  const created = await prisma.boardMeeting.create({
    data: {
      title,
      meetingDate: input.meetingDate,
      agenda,
      attendees,
    },
  });

  await writeAudit({
    userId: user.id,
    action: "MEETING_CREATED",
    entityType: "BoardMeeting",
    entityId: created.id,
    metadata: { meetingDate: input.meetingDate.toISOString() },
  });

  return { ok: true, id: created.id };
}

export async function updateMeeting(
  user: SessionUser,
  id: string,
  patch: UpdateMeetingInput,
): Promise<MeetingResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to edit meetings." };
  }

  const existing = await prisma.boardMeeting.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Meeting not found." };

  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.meetingDate !== undefined) data.meetingDate = patch.meetingDate;
  if (patch.agenda !== undefined) data.agenda = patch.agenda.trim() || null;
  if (patch.minutes !== undefined) data.minutes = patch.minutes.trim() || null;
  if (patch.decisions !== undefined)
    data.decisions = patch.decisions.trim() || null;
  if (patch.attendees !== undefined)
    data.attendees = patch.attendees.map((a) => a.trim()).filter(Boolean);

  await prisma.boardMeeting.update({ where: { id }, data });

  await writeAudit({
    userId: user.id,
    action: "MEETING_UPDATED",
    entityType: "BoardMeeting",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return { ok: true, id };
}
