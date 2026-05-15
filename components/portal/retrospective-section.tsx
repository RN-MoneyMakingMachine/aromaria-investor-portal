"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { recordRetrospectiveAction } from "@/app/(portal)/chambers/decisions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type RetrospectiveEntry = {
  id: string;
  dayMark: number;
  content: string;
  recordedAt: string;
  recordedBy: { name: string };
};

const MARKS: (30 | 60 | 90)[] = [30, 60, 90];

export function RetrospectiveSection({
  decisionId,
  decidedAt,
  retrospectives,
  canEdit,
}: {
  decisionId: string;
  decidedAt: string | null;
  retrospectives: RetrospectiveEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<30 | 60 | 90 | null>(null);
  const [draft, setDraft] = useState("");

  const byMark = new Map(retrospectives.map((r) => [r.dayMark, r] as const));
  const decided = decidedAt ? new Date(decidedAt) : null;
  const now = new Date();

  function isMarkDue(mark: 30 | 60 | 90): boolean {
    if (!decided) return false;
    const due = new Date(decided);
    due.setDate(due.getDate() + mark);
    return now >= due;
  }

  async function onSubmit(mark: 30 | 60 | 90) {
    setError(null);
    if (!draft.trim()) return;
    const r = await recordRetrospectiveAction(decisionId, mark, draft);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setEditing(null);
    setDraft("");
    startTransition(() => router.refresh());
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            30 / 60 / 90-day retrospectives
          </span>
        </div>

        {!decided ? (
          <p className="text-xs text-[var(--text-tertiary)]">
            Retrospectives unlock once the decision is implemented.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
            {MARKS.map((mark) => {
              const entry = byMark.get(mark);
              const due = isMarkDue(mark);
              return (
                <li key={mark} className="flex flex-col gap-2 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-widest",
                        entry
                          ? "text-[var(--text-secondary)]"
                          : due
                            ? "text-[var(--accent-amber)]"
                            : "text-[var(--text-tertiary)]",
                      )}
                    >
                      Day {mark}{" "}
                      {entry ? "· recorded" : due ? "· due" : "· upcoming"}
                    </span>
                    {canEdit && due ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(mark);
                          setDraft(entry?.content ?? "");
                        }}
                        className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      >
                        <Pencil className="h-3 w-3" />
                        {entry ? "Edit" : "Record"}
                      </button>
                    ) : null}
                  </div>
                  {editing === mark ? (
                    <div className="flex flex-col gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={5}
                        autoFocus
                        disabled={pending}
                        placeholder="What was the outcome? What did we learn?"
                        className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setEditing(null);
                            setDraft("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={pending || !draft.trim()}
                          onClick={() => onSubmit(mark)}
                        >
                          {pending ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : entry ? (
                    <div className="flex flex-col gap-1">
                      <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                        {entry.content}
                      </p>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {entry.recordedBy.name} ·{" "}
                        {formatTimestamp(new Date(entry.recordedAt))}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs italic text-[var(--text-tertiary)]">
                      {due
                        ? "Retrospective is due — record the outcome."
                        : "Will become due once the milestone is reached."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
