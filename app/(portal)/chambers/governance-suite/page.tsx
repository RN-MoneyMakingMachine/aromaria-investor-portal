import { Card, CardContent } from "@/components/ui/card";
import { GovernanceDocCard } from "@/components/portal/governance-doc-card";
import { ProgressBar } from "@/components/portal/progress-bar";
import { requireUser } from "@/lib/session";
import { listGovernanceDocuments } from "@/lib/services/governance-suite";

export default async function GovernanceSuitePage() {
  await requireUser();

  const docs = await listGovernanceDocuments();
  const totalSteps = docs.reduce((acc, d) => acc + d.total, 0);
  const completedSteps = docs.reduce((acc, d) => acc + d.completed, 0);
  const percent =
    totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);
  const docsAllDone = docs.filter((d) => d.total > 0 && d.completed === d.total)
    .length;

  return (
    <div className="flex flex-col gap-10 py-6 md:gap-12">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          The Chambers · Institutional Architecture
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
          Governance Suite
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          The eight governance documents and their institutionalisation
          progress.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Portal overview
              </span>
              <span className="font-serif text-2xl font-light text-[var(--text-primary)] md:text-3xl">
                {completedSteps}
                <span className="text-[var(--text-tertiary)]"> of </span>
                {totalSteps}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                Adoption items completed across the eight governance documents.
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="tabular font-mono text-xs text-[var(--text-tertiary)]">
                {percent}%
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                {docsAllDone} of {docs.length} documents fully adopted
              </span>
            </div>
          </div>
          <ProgressBar value={percent} tone="green" />
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {docs.map((d) => (
          <GovernanceDocCard
            key={d.code}
            href={`/chambers/governance-suite/${d.code}`}
            section={d.section}
            title={d.short}
            completed={d.completed}
            total={d.total}
          />
        ))}
      </div>
    </div>
  );
}
