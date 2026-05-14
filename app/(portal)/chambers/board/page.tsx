import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { listMeetings } from "@/lib/services/meetings";

export default async function BoardListPage() {
  const user = await requireUser();
  const meetings = await listMeetings();

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            <Link
              href="/chambers"
              className="hover:text-[var(--text-secondary)]"
            >
              Chambers
            </Link>{" "}
            / Board Meetings
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
            Board meetings
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {meetings.length === 0
              ? "No meetings scheduled yet."
              : `${meetings.length} meeting${meetings.length === 1 ? "" : "s"} on record.`}
          </p>
        </div>
        {canEdit(user) ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/chambers/board/new">Schedule meeting</Link>
          </Button>
        ) : null}
      </header>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[var(--text-secondary)]">
            The first board session will appear here once scheduled.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => (
            <Link
              key={m.id}
              href={`/chambers/board/${m.id}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-[var(--metal-mid)]">
                <CardContent className="flex items-center justify-between gap-6 p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {m.agenda ? (
                        <Badge variant="outline">Agenda</Badge>
                      ) : null}
                      {m.minutes ? (
                        <Badge variant="green">Minutes</Badge>
                      ) : null}
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {m.attendees.length}{" "}
                        {m.attendees.length === 1 ? "attendee" : "attendees"}
                      </span>
                    </div>
                    <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
                      {m.title}
                    </h2>
                  </div>
                  <div className="text-right text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    {formatTimestamp(m.meetingDate)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
