import { DoorCard } from "@/components/portal/door-card";
import { SIDE_LABEL } from "@/lib/constants";
import { firstName, requireUser } from "@/lib/session";

export default async function WelcomePage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-10 py-8 md:gap-16 md:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-5xl">
          Welcome, {firstName(user.name)}.
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {user.title ?? user.role}
          <span className="mx-2 text-[var(--text-tertiary)]">,</span>
          {SIDE_LABEL[user.side] ?? user.side}
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <DoorCard
          href="/deliverables"
          eyebrow="Section I to III"
          title="Investment Deliverables"
          body="31 commitments under Exhibit A. Track approvals, documents, and progress."
        />
        <DoorCard
          href="/chambers"
          eyebrow="Board, Reporting, Calculator"
          title="The Chambers"
          body="Board meetings, reporting, and operational records."
        />
      </div>
    </div>
  );
}
