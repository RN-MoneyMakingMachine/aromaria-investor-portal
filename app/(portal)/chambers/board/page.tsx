import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { MeetingStatus, MeetingType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { listMeetingsRich } from "@/lib/services/board-copilot";

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

export default async function BoardListPage() {
  const user = await requireUser();
  const meetings = await listMeetingsRich();

  const live = meetings.find((m) => m.status === "IN_PROGRESS");
  const nextScheduled = meetings.find((m) => m.status === "SCHEDULED");
  const featured = live ?? nextScheduled;
  const otherUpcoming = meetings.filter(
    (m) => m.status === "SCHEDULED" && m.id !== featured?.id,
  );
  const past = meetings.filter(
    (m) => m.status === "COMPLETED" || m.status === "MINUTES_APPROVED",
  );

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            <Link href="/chambers" className="hover:text-[var(--text-secondary)]">
              Chambers
            </Link>{" "}
            / Board Meetings
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
            Board meetings
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Where the partnership decides.
          </p>
        </div>
        {canEdit(user) ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/chambers/board/new">Schedule meeting</Link>
          </Button>
        ) : null}
      </header>

      {featured ? (
        <Link href={`/chambers/board/${featured.id}`} className="group block">
          <Card
            className={
              featured.status === "IN_PROGRESS"
                ? "border-l-2 border-l-[var(--accent-green)] transition-colors group-hover:border-[var(--accent-green)]"
                : "border-l-2 border-l-[var(--metal-mid)] transition-colors group-hover:border-[var(--metal-mid)]"
            }
          >
            <CardContent className="flex flex-col gap-5 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  {featured.status === "IN_PROGRESS" ? "Meeting in progress" : "Upcoming"}
                </span>
                <Badge variant="metal">{TYPE_LABEL[featured.type]}</Badge>
                <span
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: STATUS_TONE[featured.status] }}
                >
                  {STATUS_LABEL[featured.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-2xl font-light text-[var(--text-primary)] md:text-3xl">
                    {featured.title}
                  </h2>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {formatTimestamp(featured.startsAt ?? featured.meetingDate)}
                    {featured.location ? ` · ${featured.location}` : ""}
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                <span>{featured._count.agendaItems} agenda items</span>
                <span>·</span>
                <span>{featured._count.resolutions} resolutions queued</span>
                <span>·</span>
                <span>{featured._count.rsvps} RSVPs in</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[var(--text-secondary)]">
            No upcoming sessions scheduled.
          </CardContent>
        </Card>
      )}

      {otherUpcoming.length > 0 ? (
        <section className="flex flex-col gap-4">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Also upcoming
          </span>
          <div className="flex flex-col gap-3">
            {otherUpcoming.map((m) => (
              <MeetingRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="flex flex-col gap-4">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Past meetings
          </span>
          <div className="flex flex-col gap-3">
            {past.map((m) => (
              <MeetingRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

type MeetingRowMeeting = {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  meetingDate: Date;
  startsAt: Date | null;
  _count: { agendaItems: number; resolutions: number; rsvps: number };
};

function MeetingRow({ m }: { m: MeetingRowMeeting }) {
  return (
    <Link href={`/chambers/board/${m.id}`} className="group block">
      <Card className="transition-colors group-hover:border-[var(--metal-mid)]">
        <CardContent className="flex items-center justify-between gap-6 p-5 md:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="metal">{TYPE_LABEL[m.type]}</Badge>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: STATUS_TONE[m.status] }}
              >
                {STATUS_LABEL[m.status]}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                {m._count.resolutions} resolution
                {m._count.resolutions === 1 ? "" : "s"}
              </span>
            </div>
            <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
              {m.title}
            </h2>
          </div>
          <div className="text-right text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {formatTimestamp(m.startsAt ?? m.meetingDate)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
