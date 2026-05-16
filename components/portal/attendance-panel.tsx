"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, UserCheck, UserX, UserMinus } from "lucide-react";
import type { RsvpStatus, Side } from "@prisma/client";

import { recordRsvpAction } from "@/app/(portal)/chambers/board/copilot-actions";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<RsvpStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  PROXY: "Sending proxy",
};

const STATUS_TONE: Record<RsvpStatus, string> = {
  PENDING: "var(--text-tertiary)",
  CONFIRMED: "var(--accent-green)",
  DECLINED: "var(--accent-red)",
  PROXY: "var(--accent-blue)",
};

export type DirectorRsvp = {
  userId: string;
  name: string;
  side: Side;
  title: string | null;
  status: RsvpStatus;
};

export function AttendancePanel({
  meetingId,
  directors,
  currentUserId,
}: {
  meetingId: string;
  directors: DirectorRsvp[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onSelfRsvp(status: RsvpStatus) {
    setError(null);
    setBusyId(currentUserId);
    const r = await recordRsvpAction(meetingId, status);
    setBusyId(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  const me = directors.find((d) => d.userId === currentUserId);
  const confirmedCount = directors.filter((d) => d.status === "CONFIRMED").length;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Attendance
          </span>
          <span className="tabular font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {confirmedCount} of {directors.length} confirmed
          </span>
        </div>

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        {me ? (
          <div className="flex flex-col gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Your RSVP
            </span>
            <div className="flex flex-wrap gap-1.5">
              <RsvpButton
                status="CONFIRMED"
                active={me.status === "CONFIRMED"}
                disabled={pending || busyId === currentUserId}
                onClick={() => onSelfRsvp("CONFIRMED")}
                icon={<UserCheck className="h-3.5 w-3.5" />}
                label="Confirm"
              />
              <RsvpButton
                status="DECLINED"
                active={me.status === "DECLINED"}
                disabled={pending || busyId === currentUserId}
                onClick={() => onSelfRsvp("DECLINED")}
                icon={<UserX className="h-3.5 w-3.5" />}
                label="Decline"
              />
              <RsvpButton
                status="PROXY"
                active={me.status === "PROXY"}
                disabled={pending || busyId === currentUserId}
                onClick={() => onSelfRsvp("PROXY")}
                icon={<UserMinus className="h-3.5 w-3.5" />}
                label="Send proxy"
              />
            </div>
          </div>
        ) : null}

        <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
          {directors.map((d) => (
            <li
              key={d.userId}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-[var(--text-primary)]">{d.name}</span>
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  {d.title ?? d.side}
                </span>
              </div>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: STATUS_TONE[d.status] }}
              >
                {d.status === "CONFIRMED" ? <Check className="inline h-3 w-3" /> : null}{" "}
                {STATUS_LABEL[d.status]}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RsvpButton({
  status,
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  status: RsvpStatus;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
        active
          ? "border-transparent text-[var(--bg-base)]"
          : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]",
        disabled && "opacity-60",
      )}
      style={
        active
          ? {
              background: STATUS_TONE[status],
            }
          : undefined
      }
    >
      {icon}
      {label}
    </button>
  );
}
