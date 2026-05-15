import Link from "next/link";
import { notFound } from "next/navigation";

import { DecisionStatusPill } from "@/components/portal/pills";
import { DecisionZonePill } from "@/components/portal/decision-zone-pill";
import { DependencyList } from "@/components/portal/dependency-list";
import { RetrospectiveSection } from "@/components/portal/retrospective-section";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatTimestamp } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { getDecision } from "@/lib/services/decisions";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const decision = await getDecision(id);
  if (!decision) notFound();

  const candidates = await prisma.decision.findMany({
    where: { id: { not: decision.id } },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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
          {decision.zone ? (
            <DecisionZonePill zone={decision.zone} tier={decision.tier} />
          ) : null}
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
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
          {decision.title}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Summary
            </h2>
            <Card>
              <CardContent className="p-5 md:p-6">
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
                <CardContent className="p-5 md:p-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {decision.body}
                  </p>
                </CardContent>
              </Card>
            </section>
          ) : null}

          <DependencyList
            decisionId={decision.id}
            prerequisites={decision.prerequisites.map((p) => ({
              id: p.id,
              decision: {
                id: p.prerequisite.id,
                title: p.prerequisite.title,
                status: p.prerequisite.status,
                zone: p.prerequisite.zone,
              },
            }))}
            dependents={decision.dependents.map((d) => ({
              id: d.id,
              decision: {
                id: d.dependent.id,
                title: d.dependent.title,
                status: d.dependent.status,
                zone: d.dependent.zone,
              },
            }))}
            candidates={candidates}
            canEdit={canEdit(user)}
          />

          <RetrospectiveSection
            decisionId={decision.id}
            decidedAt={
              decision.decidedAt ? decision.decidedAt.toISOString() : null
            }
            retrospectives={decision.retrospectives.map((r) => ({
              id: r.id,
              dayMark: r.dayMark,
              content: r.content,
              recordedAt: r.recordedAt.toISOString(),
              recordedBy: { name: r.recordedBy.name },
            }))}
            canEdit={canEdit(user)}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col divide-y divide-[var(--border-subtle)] p-0">
              <DetailRow label="Owner">
                <span className="text-sm text-[var(--text-primary)]">
                  {decision.owner ? decision.owner.name : "Unassigned"}
                </span>
              </DetailRow>
              <DetailRow label="Target completion">
                <span className="text-sm text-[var(--text-secondary)]">
                  {decision.targetCompletionDate
                    ? formatDate(decision.targetCompletionDate)
                    : "Not set"}
                </span>
              </DetailRow>
              <DetailRow label="Zone">
                <span className="text-sm text-[var(--text-secondary)]">
                  {decision.zone ?? "Unclassified"}
                </span>
              </DetailRow>
              <DetailRow label="Tier">
                <span className="text-sm text-[var(--text-secondary)]">
                  {decision.tier ?? "—"}
                </span>
              </DetailRow>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 md:px-6 md:py-4">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
