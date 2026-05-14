"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createMeetingAction,
  type MeetingFormState,
} from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving" : "Save meeting"}
    </Button>
  );
}

export function NewMeetingForm() {
  const [state, action] = useActionState<MeetingFormState, FormData>(
    createMeetingAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={state.title ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="meetingDate">Date and time</Label>
        <Input
          id="meetingDate"
          name="meetingDate"
          type="datetime-local"
          required
          defaultValue={state.meetingDate ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="attendees">Attendees</Label>
        <Input
          id="attendees"
          name="attendees"
          placeholder="Comma-separated names"
          defaultValue={state.attendees ?? ""}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="agenda">Agenda</Label>
        <textarea
          id="agenda"
          name="agenda"
          rows={6}
          defaultValue={state.agenda ?? ""}
          className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-strong)]"
        />
      </div>

      {state.error ? (
        <p className="text-xs text-[var(--accent-red)]">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
