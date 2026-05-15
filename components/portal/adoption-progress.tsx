"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  createAdoptionStepAction,
  deleteAdoptionStepAction,
  toggleAdoptionStepAction,
  updateAdoptionStepAction,
} from "@/app/(portal)/deliverables/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type AdoptionStepClient = {
  id: string;
  title: string;
  order: number;
  checkedAt: string | null;
  checkedBy: { id: string; name: string } | null;
};

export function AdoptionProgress({
  deliverableId,
  steps,
  canManage,
}: {
  deliverableId: string;
  steps: AdoptionStepClient[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  const completed = steps.filter((s) => s.checkedAt).length;
  const total = steps.length;

  async function onToggle(stepId: string) {
    setError(null);
    setBusyId(stepId);
    const result = await toggleAdoptionStepAction(stepId);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
  }

  async function onDelete(stepId: string, title: string) {
    if (!confirm(`Delete this step?\n\n"${title}"`)) return;
    setError(null);
    setBusyId(stepId);
    const result = await deleteAdoptionStepAction(stepId);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
  }

  async function onCreate(title: string): Promise<boolean> {
    setError(null);
    const result = await createAdoptionStepAction(deliverableId, title);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    refresh();
    return true;
  }

  async function onUpdate(stepId: string, title: string): Promise<boolean> {
    setError(null);
    setBusyId(stepId);
    const result = await updateAdoptionStepAction(stepId, title);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    refresh();
    return true;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ListChecks className="h-4 w-4 text-[var(--text-tertiary)]" />
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Adoption Progress
              </span>
              {total > 0 ? (
                <span className="tabular font-mono text-[10px] text-[var(--text-tertiary)]">
                  {completed} / {total}
                </span>
              ) : null}
            </div>
            {canManage && !addOpen ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add step
              </Button>
            ) : null}
          </div>

          {error ? (
            <p className="text-xs text-[var(--accent-red)]">{error}</p>
          ) : null}

          {steps.length === 0 && !addOpen ? (
            <p className="rounded-sm border border-dashed border-[var(--border-subtle)] px-6 py-8 text-center text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
              No adoption steps yet
            </p>
          ) : null}

          <ul className="flex flex-col gap-2">
            {steps.map((s) => (
              <li key={s.id}>
                {editingId === s.id ? (
                  <StepEditor
                    initialTitle={s.title}
                    busy={pending || busyId === s.id}
                    onSubmit={async (t) => {
                      const ok = await onUpdate(s.id, t);
                      if (ok) setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <StepRow
                    step={s}
                    canManage={canManage}
                    busy={pending || busyId === s.id}
                    onToggle={() => onToggle(s.id)}
                    onEdit={() => setEditingId(s.id)}
                    onDelete={() => onDelete(s.id, s.title)}
                  />
                )}
              </li>
            ))}
          </ul>

          {canManage && addOpen ? (
            <StepEditor
              initialTitle=""
              busy={pending}
              placeholder="What needs to happen…"
              submitLabel="Add step"
              onSubmit={async (t) => {
                const ok = await onCreate(t);
                if (ok) setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          ) : null}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function StepRow({
  step,
  canManage,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  step: AdoptionStepClient;
  canManage: boolean;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isChecked = !!step.checkedAt;
  return (
    <div className="group flex items-start gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-[var(--bg-elevated)]">
      <button
        type="button"
        onClick={onToggle}
        disabled={!canManage || busy}
        aria-pressed={isChecked}
        aria-label={isChecked ? "Mark as not done" : "Mark as done"}
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
          isChecked
            ? "border-[var(--accent-green)] bg-[var(--accent-green)] text-[var(--bg-base)]"
            : "border-[var(--border-strong)] bg-transparent text-transparent",
          canManage && !busy
            ? "hover:border-[var(--accent-green)]"
            : "cursor-not-allowed opacity-70",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm",
            isChecked
              ? "text-[var(--text-tertiary)] line-through"
              : "text-[var(--text-primary)]",
          )}
        >
          {step.title}
        </span>
        {isChecked && step.checkedBy && step.checkedAt ? (
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {step.checkedBy.name}
            <span className="mx-1.5">,</span>
            {formatTimestamp(new Date(step.checkedAt))}
          </span>
        ) : null}
      </div>
      {canManage ? (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onEdit}
                disabled={busy}
                aria-label="Edit step"
                className="rounded-sm p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)] disabled:opacity-50"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                aria-label="Delete step"
                className="rounded-sm p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-base)] hover:text-[var(--accent-red)] disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
    </div>
  );
}

function StepEditor({
  initialTitle,
  busy,
  placeholder = "Edit step…",
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  initialTitle: string;
  busy: boolean;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (title: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialTitle);

  function attempt(e: React.FormEvent) {
    e.preventDefault();
    const t = value.trim();
    if (!t) return;
    void onSubmit(t);
  }

  return (
    <form
      onSubmit={attempt}
      className="flex flex-wrap items-center gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        disabled={busy}
        className="flex-1 bg-transparent px-2 py-1 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
      />
      <Button type="submit" variant="primary" size="sm" disabled={busy || !value.trim()}>
        <Check className="mr-2 h-3.5 w-3.5" />
        {submitLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={onCancel}
      >
        <X className="mr-2 h-3.5 w-3.5" />
        Cancel
      </Button>
    </form>
  );
}
