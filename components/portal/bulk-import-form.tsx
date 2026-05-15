"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import {
  bulkImportAdoptionStepsAction,
  type BulkImportFormState,
} from "@/app/(portal)/admin/adoption-import/actions";
import { Button } from "@/components/ui/button";

const INITIAL_STATE: BulkImportFormState = { kind: "idle" };

export function BulkImportForm({
  deliverables,
}: {
  deliverables: { id: string; code: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    bulkImportAdoptionStepsAction,
    INITIAL_STATE,
  );
  const [selectedId, setSelectedId] = useState("");
  const [steps, setSteps] = useState("");

  const lineCount = useMemo(
    () =>
      steps
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("#")).length,
    [steps],
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="deliverableId"
          className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]"
        >
          Deliverable
        </label>
        <select
          id="deliverableId"
          name="deliverableId"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-tertiary)]"
        >
          <option value="">Select a deliverable…</option>
          {deliverables.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} · {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3">
          <label
            htmlFor="steps"
            className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]"
          >
            Steps (one per line)
          </label>
          <span className="tabular font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {lineCount} line{lineCount === 1 ? "" : "s"}
          </span>
        </div>
        <textarea
          id="steps"
          name="steps"
          required
          rows={14}
          spellCheck={false}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder={
            "Company-wide announcement meeting — Jorge Nikaido (CEO) — Month 1\nCompany-wide email rollout — Jorge Nikaido (CEO) — Month 1\n…"
          }
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--text-primary)] outline-none focus:border-[var(--text-tertiary)]"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <input
          type="checkbox"
          name="redirectAfter"
          defaultChecked
          className="h-4 w-4 accent-[var(--accent-green)]"
        />
        Open the deliverable when done
      </label>

      {state.kind === "error" ? (
        <p className="text-xs text-[var(--accent-red)]">{state.error}</p>
      ) : null}
      {state.kind === "ok" ? (
        <p className="text-xs text-[var(--accent-green)]">
          Added {state.created} step{state.created === 1 ? "" : "s"} to{" "}
          {state.deliverableName}.
          {state.skipped > 0
            ? ` ${state.skipped} duplicate${state.skipped === 1 ? "" : "s"} skipped.`
            : null}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin"
          className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          ← Admin
        </Link>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Importing…" : "Import"}
        </Button>
      </div>
    </form>
  );
}
