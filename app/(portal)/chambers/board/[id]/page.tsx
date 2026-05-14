import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getMeeting } from "@/lib/services/meetings";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers/board"
            className="hover:text-[var(--text-secondary)]"
          >
            Board meetings
          </Link>{" "}
          / Detail
        </p>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {formatTimestamp(meeting.meetingDate)}
        </span>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          {meeting.title}
        </h1>
      </header>

      <Section title="Agenda">
        {meeting.agenda ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
            {meeting.agenda}
          </p>
        ) : (
          <Empty>No agenda recorded.</Empty>
        )}
      </Section>

      <Section title="Minutes">
        {meeting.minutes ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
            {meeting.minutes}
          </p>
        ) : (
          <Empty>Minutes not yet recorded.</Empty>
        )}
      </Section>

      <Section title="Decisions">
        {meeting.decisions ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
            {meeting.decisions}
          </p>
        ) : (
          <Empty>No decisions noted on this meeting.</Empty>
        )}
      </Section>

      <Section title="Attendees">
        {meeting.attendees.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
            {meeting.attendees.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : (
          <Empty>No attendees recorded.</Empty>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {title}
      </h2>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm italic text-[var(--text-tertiary)]">{children}</p>
  );
}
