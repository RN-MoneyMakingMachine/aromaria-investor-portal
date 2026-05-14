import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DecisionStatusPill } from "@/components/portal/pills";
import { formatDate } from "@/lib/dates";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { listDecisions } from "@/lib/services/decisions";

export default async function DecisionsListPage() {
  const user = await requireUser();
  const decisions = await listDecisions();

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
            / Commercial Decisions
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
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
        <div className="flex flex-col gap-3">
          {decisions.map((d) => (
            <Link
              key={d.id}
              href={`/chambers/decisions/${d.id}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-[var(--metal-mid)]">
                <CardContent className="flex items-start justify-between gap-6 p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <DecisionStatusPill status={d.status} />
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        Logged by {d.createdBy.name}
                      </span>
                    </div>
                    <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
                      {d.title}
                    </h2>
                    <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
                      {d.summary}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    {d.decidedAt ? (
                      <span>Decided {formatDate(d.decidedAt)}</span>
                    ) : (
                      <span>Open</span>
                    )}
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
