"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";
import type { MeetingStatus } from "@prisma/client";

import {
  endMeetingAction,
  startMeetingAction,
} from "@/app/(portal)/chambers/board/copilot-actions";
import { Button } from "@/components/ui/button";

export function MeetingControl({
  meetingId,
  status,
}: {
  meetingId: string;
  status: MeetingStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onStart() {
    setError(null);
    const r = await startMeetingAction(meetingId);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function onEnd() {
    if (!confirm("End the meeting? Voting will close.")) return;
    setError(null);
    const r = await endMeetingAction(meetingId);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {status === "SCHEDULED" ? (
        <Button type="button" variant="primary" size="sm" disabled={pending} onClick={onStart}>
          <Play className="mr-2 h-3.5 w-3.5" />
          Start meeting
        </Button>
      ) : status === "IN_PROGRESS" ? (
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onEnd}>
          <Pause className="mr-2 h-3.5 w-3.5" />
          End meeting
        </Button>
      ) : null}
      {error ? (
        <p className="text-xs text-[var(--accent-red)]">{error}</p>
      ) : null}
    </div>
  );
}
