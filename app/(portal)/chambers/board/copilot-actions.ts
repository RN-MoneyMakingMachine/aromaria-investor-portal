"use server";

import { revalidatePath } from "next/cache";
import type {
  AgendaItemType,
  ResolutionThresholdType,
  RsvpStatus,
  VoteChoice,
} from "@prisma/client";

import { requireUser } from "@/lib/session";
import {
  addAgendaItem,
  castVote,
  createResolution,
  endMeeting,
  recordRsvp,
  removeAgendaItem,
  resolveResolution,
  startMeeting,
} from "@/lib/services/board-copilot";

export type ActionResult = { ok: true } | { ok: false; error: string };

function refreshBoard(meetingId: string) {
  revalidatePath("/chambers/board");
  revalidatePath(`/chambers/board/${meetingId}`);
}

export async function addAgendaItemAction(
  meetingId: string,
  input: {
    title: string;
    body?: string;
    leadPresenter?: string;
    timeMinutes?: number;
    itemType: AgendaItemType;
  },
): Promise<ActionResult> {
  const user = await requireUser();
  const r = await addAgendaItem(user, meetingId, input);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function removeAgendaItemAction(
  meetingId: string,
  itemId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const r = await removeAgendaItem(user, itemId);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function recordRsvpAction(
  meetingId: string,
  status: RsvpStatus,
  note?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const r = await recordRsvp(user, meetingId, status, note);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function startMeetingAction(meetingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const r = await startMeeting(user, meetingId);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function endMeetingAction(meetingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const r = await endMeeting(user, meetingId);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function createResolutionAction(
  meetingId: string,
  input: { title: string; body: string; thresholdType: ResolutionThresholdType },
): Promise<ActionResult> {
  const user = await requireUser();
  const r = await createResolution(user, meetingId, input);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function castVoteAction(
  meetingId: string,
  resolutionId: string,
  choice: VoteChoice,
  comment?: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const r = await castVote(user, resolutionId, choice, comment);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}

export async function resolveResolutionAction(
  meetingId: string,
  resolutionId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const r = await resolveResolution(user, resolutionId);
  if (!r.ok) return r;
  refreshBoard(meetingId);
  return { ok: true };
}
