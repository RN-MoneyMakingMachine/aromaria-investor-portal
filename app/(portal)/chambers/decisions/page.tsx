import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DecisionFilters } from "@/components/portal/decision-filters";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { listDecisions } from "@/lib/services/decisions";

export default async function DecisionsListPage() {
  const user = await requireUser();
  const decisions = await listDecisions();

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            <Link
              href="/chambers"
              className="hover:text-[var(--text-secondary)]"
            >
              Chambers
            </Link>{" "}
            / Commercial Decisions
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
            Commercial decisions
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {decisions.length === 0
              ? "No decisions logged yet."
              : `${decisions.length} decision${decisions.length === 1 ? "" : "s"} on file.`}
          </p>
        </div>
        {canEdit(user) ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/chambers/decisions/new">Record decision</Link>
          </Button>
        ) : null}
      </header>

      {decisions.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[var(--text-secondary)]">
            The first decision will appear here once recorded.
          </CardContent>
        </Card>
      ) : (
        <DecisionFilters
          decisions={decisions.map((d) => ({
            id: d.id,
            title: d.title,
            summary: d.summary,
            status: d.status,
            zone: d.zone,
            tier: d.tier,
            decidedAt: d.decidedAt ? d.decidedAt.toISOString() : null,
            createdBy: { name: d.createdBy.name },
            owner: d.owner ? { name: d.owner.name } : null,
          }))}
        />
      )}
    </div>
  );
}
