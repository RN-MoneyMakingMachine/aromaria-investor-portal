import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import type { MeetingStatus, MeetingType } from "@prisma/client";

import { AgendaList } from "@/components/portal/agenda-list";
import { AttendancePanel, type DirectorRsvp } from "@/components/portal/attendance-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingControl } from "@/components/portal/meeting-control";
import { NewResolutionForm } from "@/components/portal/new-resolution-form";
import { ResolutionCard } from "@/components/portal/resolution-card";
import { canEdit, isAdmin } from "@/lib/rbac";
import { formatTimestamp } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import {
  getMeetingFull,
  listEligibleDirectors,
} from "@/lib/services/board-copilot";

const TYPE_LABEL: Record<MeetingType, string> = {
  REGULAR: "Regular",
  QUARTERLY: "Quarterly",
  SPECIAL: "Special",
  EMERGENCY: "Emergency",
};

const STATUS_LABEL: Record<MeetingStatus, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "Live",
  COMPLETED: "Completed",
  MINUTES_APPROVED: "Minutes approved",
};

const STATUS_TONE: Record<MeetingStatus, string> = {
  SCHEDULED: "var(--text-tertiary)",
  IN_PROGRESS: "var(--accent-green)",
  COMPLETED: "var(--accent-blue)",
  MINUTES_APPROVED: "var(--accent-blue)",
};

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const meeting = await getMeetingFull(id);
  if (!meeting) notFound();

  const directors = await listEligibleDirectors();

  const directorRsvps: DirectorRsvp[] = directors.map((d) => {
    const rsvp = meeting.rsvps.find((r) => r.userId === d.id);
    return {
      userId: d.id,
      name: d.name,
      side: d.side,
      title: d.title,
      status: rsvp?.rsvpStatus ?? "PENDING",
    };
  });

  const live = meeting.status === "IN_PROGRESS";
  const userIsAdmin = isAdmin(user);
  const userCanEdit = canEdit(user);
  const meetingLocked =
    meeting.status === "COMPLETED" || meeting.status === "MINUTES_APPROVED";

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href="/chambers/board"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Board meetings
        </Link>
      </div>

      <header
        className={
          live
            ? "rounded-sm border-l-2 border-l-[var(--accent-green)] bg-[color-mix(in_srgb,var(--accent-green)_4%,transparent)] p-5 md:p-6"
            : ""
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="metal">{TYPE_LABEL[meeting.type]}</Badge>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: STATUS_TONE[meeting.status] }}
              >
                {STATUS_LABEL[meeting.status]}
              </span>
              {live ? (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--accent-green)]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-green)]" />
                  Meeting in progress
                </span>
              ) : null}
            </div>
            <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              <span>{formatTimestamp(meeting.startsAt ?? meeting.meetingDate)}</span>
              {meeting.location ? (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </span>
                </>
              ) : null}
              {meeting.durationMin ? (
                <>
                  <span>·</span>
                  <span>{meeting.durationMin} min planned</span>
                </>
              ) : null}
            </div>
          </div>
          {userCanEdit ? (
            <MeetingControl meetingId={meeting.id} status={meeting.status} />
          ) : null}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <AgendaList
            meetingId={meeting.id}
            items={meeting.agendaItems.map((i) => ({
              id: i.id,
              title: i.title,
              body: i.body,
              leadPresenter: i.leadPresenter,
              timeMinutes: i.timeMinutes,
              itemType: i.itemType,
              order: i.order,
            }))}
            canEdit={userCanEdit}
            locked={meetingLocked}
          />

          <section className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Resolutions
            </span>
            {meeting.resolutions.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-center text-xs italic text-[var(--text-tertiary)] md:p-6">
                  No resolutions queued.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {meeting.resolutions.map((r) => (
                  <ResolutionCard
                    key={r.id}
                    meetingId={meeting.id}
                    resolution={{
                      id: r.id,
                      title: r.title,
                      body: r.body,
                      thresholdType: r.thresholdType,
                      outcome: r.outcome,
                      lockedAt: r.lockedAt ? r.lockedAt.toISOString() : null,
                      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
                      votes: r.votes.map((v) => ({
                        id: v.id,
                        userId: v.userId,
                        choice: v.choice,
                        user: { id: v.user.id, name: v.user.name, side: v.user.side },
                      })),
                    }}
                    currentUser={{ id: user.id, side: user.side, role: user.role }}
                    meetingLive={live}
                    isAdmin={userIsAdmin}
                  />
                ))}
              </div>
            )}
            {userCanEdit && !meetingLocked ? (
              <NewResolutionForm meetingId={meeting.id} />
            ) : null}
          </section>

          {meeting.minutes ? (
            <section className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Minutes
              </span>
              <Card>
                <CardContent className="p-5 md:p-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {meeting.minutes}
                  </p>
                </CardContent>
              </Card>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          <AttendancePanel
            meetingId={meeting.id}
            directors={directorRsvps}
            currentUserId={user.id}
          />
        </aside>
      </div>
    </div>
  );
}
