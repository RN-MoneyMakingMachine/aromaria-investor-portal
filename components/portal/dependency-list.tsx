"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import type { DecisionStatus, DecisionZone } from "@prisma/client";

import {
  addDependencyAction,
  removeDependencyAction,
} from "@/app/(portal)/chambers/decisions/actions";
import { DecisionStatusPill } from "@/components/portal/pills";
import { DecisionZonePill } from "@/components/portal/decision-zone-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type DependencyEntry = {
  id: string; // dependency record id
  decision: {
    id: string;
    title: string;
    status: DecisionStatus;
    zone: DecisionZone | null;
  };
};

export type DecisionLite = {
  id: string;
  title: string;
};

export function DependencyList({
  decisionId,
  prerequisites,
  dependents,
  candidates,
  canEdit,
}: {
  decisionId: string;
  prerequisites: DependencyEntry[];
  dependents: DependencyEntry[];
  candidates: DecisionLite[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addingFor, setAddingFor] = useState<"prerequisites" | null>(null);
  const [selectedId, setSelectedId] = useState("");

  const usedIds = new Set([
    decisionId,
    ...prerequisites.map((p) => p.decision.id),
    ...dependents.map((d) => d.decision.id),
  ]);
  const availableCandidates = candidates.filter((c) => !usedIds.has(c.id));

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onAdd() {
    if (!selectedId) return;
    setError(null);
    const r = await addDependencyAction(decisionId, selectedId);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAddingFor(null);
    setSelectedId("");
    refresh();
  }

  async function onRemove(id: string) {
    if (!confirm("Remove this dependency?")) return;
    setError(null);
    const r = await removeDependencyAction(id);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Dependencies
          </span>
        </div>

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <DependencyColumn
            title="Depends on"
            empty="No prerequisites recorded."
            entries={prerequisites}
            onRemove={canEdit ? onRemove : undefined}
          />
          <DependencyColumn
            title="Blocks"
            empty="No downstream decisions yet."
            entries={dependents}
            onRemove={undefined}
          />
        </div>

        {canEdit ? (
          addingFor ? (
            <div className="flex flex-wrap items-center gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={pending}
                className="flex-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
              >
                <option value="">Select a prerequisite decision…</option>
                {availableCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={pending || !selectedId}
                onClick={onAdd}
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setAddingFor(null);
                  setSelectedId("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || availableCandidates.length === 0}
              onClick={() => setAddingFor("prerequisites")}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add prerequisite
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

function DependencyColumn({
  title,
  empty,
  entries,
  onRemove,
}: {
  title: string;
  empty: string;
  entries: DependencyEntry[];
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {title}
      </span>
      {entries.length === 0 ? (
        <p className="text-xs text-[var(--text-tertiary)]">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="group flex items-start justify-between gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Link
                  href={`/chambers/decisions/${e.decision.id}`}
                  className="text-sm text-[var(--text-primary)] transition-colors hover:text-[var(--text-secondary)]"
                >
                  {e.decision.title}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5">
                  <DecisionStatusPill status={e.decision.status} />
                  {e.decision.zone ? (
                    <DecisionZonePill zone={e.decision.zone} />
                  ) : null}
                </div>
              </div>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(e.id)}
                  className="rounded-sm p-1.5 text-[var(--text-tertiary)] opacity-0 transition-opacity hover:text-[var(--accent-red)] group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remove dependency"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
