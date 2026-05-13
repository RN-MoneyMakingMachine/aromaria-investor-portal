import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressHeadline } from "@/components/portal/progress-bar";
import { PhaseCard, SectionCard } from "@/components/portal/section-card";
import { cn } from "@/lib/utils";
import {
  getCategorySummaries,
  getDeliverableMetrics,
  getPhaseSummaries,
} from "@/lib/services/deliverables";
import { PHASE_LABEL } from "@/lib/constants";
import { requireUser } from "@/lib/session";

type SearchParams = { view?: string };

const PHASE_DESCRIPTIONS: Record<string, string> = {
  WIRE_CONDITION:
    "Three commitments required before the wire. Critical until all three are completed.",
  COMMITTED:
    "Eight commitments aligned for Day 60. Implementation timelines run from one to six months.",
  POST_SIGNING:
    "Four legal actions to execute within statutory windows after signing.",
  COMPLETED_PRE_60D:
    "Sixteen commitments delivered before the 60 day reference. Held in the record.",
};

const PHASE_TONE: Record<string, "metal" | "green" | "amber" | "red" | "blue"> = {
  WIRE_CONDITION: "red",
  COMMITTED: "amber",
  POST_SIGNING: "red",
  COMPLETED_PRE_60D: "green",
};

export default async function DeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const { view } = await searchParams;
  const byPhase = view === "phase";

  const [metrics, categories, phases] = await Promise.all([
    getDeliverableMetrics(),
    getCategorySummaries(),
    getPhaseSummaries(),
  ]);

  const wireTone = metrics.wire.completed < metrics.wire.total ? "red" : "green";

  return (
    <div className="flex flex-col gap-12 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Section I to III, Exhibit A
        </p>
        <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
          Investment Deliverables
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {metrics.overall.completed} of {metrics.overall.total} commitments
          completed. Weighted overall progress {metrics.overall.percent}%.
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-10 p-8 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressHeadline
            label="Wire Readiness"
            completed={metrics.wire.completed}
            total={metrics.wire.total}
            percent={metrics.wire.percent}
            tone={wireTone}
            hint={
              metrics.wire.completed < metrics.wire.total
                ? "Critical, before wire"
                : "Cleared"
            }
          />
          <ProgressHeadline
            label="Day 60 Readiness"
            completed={metrics.committed.completed}
            total={metrics.committed.total}
            percent={metrics.committed.percent}
            tone="amber"
          />
          <ProgressHeadline
            label="Post Signing Legal"
            completed={metrics.postSigning.completed}
            total={metrics.postSigning.total}
            percent={metrics.postSigning.percent}
            tone="red"
          />
          <ProgressHeadline
            label="Overall"
            completed={metrics.overall.completed}
            total={metrics.overall.total}
            percent={metrics.overall.percent}
            tone="metal"
            hint="Weighted"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl font-light tracking-tight text-[var(--text-primary)]">
          {byPhase ? "By phase" : "By category"}
        </h2>
        <div className="inline-flex items-center gap-1 rounded-sm border border-[var(--border-subtle)] p-1">
          <ToggleLink href="/deliverables" active={!byPhase}>
            Category
          </ToggleLink>
          <ToggleLink href="/deliverables?view=phase" active={byPhase}>
            Phase
          </ToggleLink>
        </div>
      </div>

      {byPhase ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((p) => (
            <PhaseCard
              key={p.phase}
              label={PHASE_LABEL[p.phase]}
              description={PHASE_DESCRIPTIONS[p.phase]}
              total={p.total}
              completed={p.completed}
              percent={p.percent}
              tone={PHASE_TONE[p.phase]}
              href={`/deliverables/phase/${p.phase.toLowerCase()}`}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <SectionCard
              key={c.category}
              category={c.category}
              total={c.total}
              completed={c.completed}
              percent={c.percent}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-sm px-3 py-1 text-[10px] uppercase tracking-widest transition-colors",
        active
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
      )}
    >
      {children}
    </Link>
  );
}
