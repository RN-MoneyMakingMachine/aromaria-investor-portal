import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { DecisionStatusPill } from "@/components/portal/pills";
import { formatTimestamp } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getDecision } from "@/lib/services/decisions";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const decision = await getDecision(id);
  if (!decision) notFound();

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers/decisions"
            className="hover:text-[var(--text-secondary)]"
          >
            Commercial Decisions
          </Link>{" "}
          / Detail
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <DecisionStatusPill status={decision.status} />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Logged by {decision.createdBy.name} on{" "}
            {formatTimestamp(decision.createdAt)}
          </span>
          {decision.decidedAt ? (
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Implemented {formatTimestamp(decision.decidedAt)}
            </span>
          ) : null}
        </div>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          {decision.title}
        </h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Summary
        </h2>
        <Card>
          <CardContent className="p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {decision.summary}
            </p>
          </CardContent>
        </Card>
      </section>

      {decision.body ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Details
          </h2>
          <Card>
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {decision.body}
              </p>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
