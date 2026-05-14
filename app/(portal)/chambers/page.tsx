import { DoorCard } from "@/components/portal/door-card";
import { requireUser } from "@/lib/session";

export default async function ChambersPage() {
  await requireUser();

  return (
    <div className="flex flex-col gap-12 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          The Chambers
        </p>
        <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
          Board, reporting, decisions
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Operational records that sit alongside the investment deliverables.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DoorCard
          href="/chambers/reporting"
          eyebrow="Financials & Growth"
          title="Reporting"
          body="Periodic reports across financial, growth, creative, and special-project tracks."
        />
        <DoorCard
          href="/chambers/board"
          eyebrow="Agenda & Minutes"
          title="Board Meetings"
          body="Scheduled board sessions, agendas, attendee lists, and minutes."
        />
        <DoorCard
          href="/chambers/decisions"
          eyebrow="Commercial Log"
          title="Commercial Decisions"
          body="Record of decisions taken between the partners with status and implementation date."
        />
      </div>
    </div>
  );
}
