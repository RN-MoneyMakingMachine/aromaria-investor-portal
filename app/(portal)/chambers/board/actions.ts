"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/session";
import { createMeeting } from "@/lib/services/meetings";

export type MeetingFormState = {
  error?: string;
  title?: string;
  meetingDate?: string;
  agenda?: string;
  attendees?: string;
};

export async function createMeetingAction(
  _prev: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "");
  const meetingDate = String(formData.get("meetingDate") ?? "");
  const agenda = String(formData.get("agenda") ?? "");
  const attendees = String(formData.get("attendees") ?? "");

  const parsedDate = new Date(meetingDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return {
      error: "Enter a valid meeting date and time.",
      title,
      meetingDate,
      agenda,
      attendees,
    };
  }

  const result = await createMeeting(user, {
    title,
    meetingDate: parsedDate,
    agenda,
    attendees: attendees.split(",").map((a) => a.trim()).filter(Boolean),
  });

  if (!result.ok) {
    return {
      error: result.error,
      title,
      meetingDate,
      agenda,
      attendees,
    };
  }

  revalidatePath("/chambers/board");
  redirect(`/chambers/board/${result.id}`);
}
