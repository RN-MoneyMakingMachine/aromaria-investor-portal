"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { AgendaItemType } from "@prisma/client";

import {
  addAgendaItemAction,
  removeAgendaItemAction,
} from "@/app/(portal)/chambers/board/copilot-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ITEM_TYPE_LABEL: Record<AgendaItemType, string> = {
  INFORMATION: "Information",
  DISCUSSION: "Discussion",
  DECISION: "Decision",
  RESERVED_MATTER: "Reserved Matter",
};

const ITEM_TYPE_VARIANT: Record<
  AgendaItemType,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  INFORMATION: "default",
  DISCUSSION: "metal",
  DECISION: "amber",
  RESERVED_MATTER: "red",
};

export type AgendaItemEntry = {
  id: string;
  title: string;
  body: string | null;
  leadPresenter: string | null;
  timeMinutes: number | null;
  itemType: AgendaItemType;
  order: number;
};

export function AgendaList({
  meetingId,
  items,
  canEdit,
  locked,
  currentItemId,
}: {
  meetingId: string;
  items: AgendaItemEntry[];
  canEdit: boolean;
  locked: boolean;
  currentItemId?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    leadPresenter: "",
    timeMinutes: "",
    itemType: "DISCUSSION" as AgendaItemType,
  });

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onSubmit() {
    setError(null);
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    const r = await addAgendaItemAction(meetingId, {
      title: draft.title,
      leadPresenter: draft.leadPresenter || undefined,
      timeMinutes: draft.timeMinutes ? Number(draft.timeMinutes) : undefined,
      itemType: draft.itemType,
    });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAdding(false);
    setDraft({ title: "", leadPresenter: "", timeMinutes: "", itemType: "DISCUSSION" });
    refresh();
  }

  async function onRemove(id: string) {
    if (!confirm("Remove this agenda item?")) return;
    setError(null);
    const r = await removeAgendaItemAction(meetingId, id);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    refresh();
  }

  const totalMinutes = items.reduce((acc, i) => acc + (i.timeMinutes ?? 0), 0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Agenda
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {items.length} item{items.length === 1 ? "" : "s"} ·{" "}
              {totalMinutes > 0 ? `${totalMinutes} min planned` : "no time set"}
            </span>
          </div>
          {canEdit && !locked && !adding ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setAdding(true)}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add item
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs text-[var(--accent-red)]">{error}</p>
        ) : null}

        {items.length === 0 && !adding ? (
          <p className="rounded-sm border border-dashed border-[var(--border-subtle)] px-4 py-6 text-center text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
            Agenda is empty.
          </p>
        ) : null}

        <ol className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className={cn(
                "group flex items-start gap-4 rounded-sm border px-3 py-3 transition-colors",
                item.id === currentItemId
                  ? "border-[var(--accent-green)] bg-[color-mix(in_srgb,var(--accent-green)_6%,transparent)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
              )}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <Badge variant={ITEM_TYPE_VARIANT[item.itemType]}>
                    {ITEM_TYPE_LABEL[item.itemType]}
                  </Badge>
                </div>
                {item.leadPresenter || item.timeMinutes ? (
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    {item.leadPresenter ? item.leadPresenter : null}
                    {item.leadPresenter && item.timeMinutes ? " · " : null}
                    {item.timeMinutes ? `${item.timeMinutes} min` : null}
                  </span>
                ) : null}
                {item.body ? (
                  <p className="text-xs text-[var(--text-secondary)]">{item.body}</p>
                ) : null}
              </div>
              {canEdit && !locked ? (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-sm p-1.5 text-[var(--text-tertiary)] opacity-0 transition-opacity hover:text-[var(--accent-red)] group-hover:opacity-100 focus:opacity-100"
                  aria-label="Remove agenda item"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : null}
            </li>
          ))}
        </ol>

        {canEdit && !locked && adding ? (
          <div className="flex flex-col gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Item title"
              className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                value={draft.leadPresenter}
                onChange={(e) =>
                  setDraft({ ...draft, leadPresenter: e.target.value })
                }
                placeholder="Lead presenter"
                className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
              />
              <input
                value={draft.timeMinutes}
                onChange={(e) =>
                  setDraft({ ...draft, timeMinutes: e.target.value })
                }
                placeholder="Minutes"
                inputMode="numeric"
                className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
              />
              <select
                value={draft.itemType}
                onChange={(e) =>
                  setDraft({ ...draft, itemType: e.target.value as AgendaItemType })
                }
                className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)]"
              >
                {Object.entries(ITEM_TYPE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={pending || !draft.title.trim()}
                onClick={onSubmit}
              >
                Add
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
