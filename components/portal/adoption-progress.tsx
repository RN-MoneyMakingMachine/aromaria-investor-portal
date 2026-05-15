"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks } from "lucide-react";

import { toggleAdoptionStepAction } from "@/app/(portal)/deliverables/actions";
import { ProgressBar } from "@/components/portal/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type AdoptionStepClient = {
  index: number;
  title: string;
  completedAt: string | null;
  completedBy: { id: string; name: string } | null;
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
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const completed = steps.filter((s) => s.completedAt).length;
  const total = steps.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isAllDone = total > 0 && completed === total;

  async function onToggle(stepIndex: number) {
    setError(null);
    setBusyIndex(stepIndex);
    const result = await toggleAdoptionStepAction(deliverableId, stepIndex);
    setBusyIndex(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-t-2 border-t-[var(--accent-green)]">
        <CardContent className="flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--accent-green)]">
                <ListChecks className="h-4 w-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  Implementation
                </span>
                <span className="font-serif text-xl font-light tracking-tight text-[var(--text-primary)]">
                  Adoption Progress
                </span>
              </div>
            </div>
            {total > 0 ? (
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    "font-serif text-2xl font-light tabular leading-none",
                    isAllDone
                      ? "text-[var(--accent-green)]"
                      : "text-[var(--text-primary)]",
                  )}
                >
                  {completed}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  of {total}
                </span>
              </div>
            ) : null}
          </div>

          {total > 0 ? (
            <div className="flex flex-col gap-1.5">
              <ProgressBar value={percent} tone="green" />
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-widest",
                    isAllDone
                      ? "text-[var(--accent-green)]"
                      : "text-transparent",
                  )}
                >
                  All steps complete
                </span>
                <span className="tabular font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  {percent}%
                </span>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-[var(--accent-red)]">{error}</p>
          ) : null}

          <ul className="flex flex-col gap-2">
            {steps.map((s) => (
              <li key={s.index}>
                <StepRow
                  step={s}
                  canManage={canManage}
                  busy={pending || busyIndex === s.index}
                  onToggle={() => onToggle(s.index)}
                />
              </li>
            ))}
          </ul>
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
}: {
  step: AdoptionStepClient;
  canManage: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  const isChecked = !!step.completedAt;
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-sm px-2 py-3 transition-colors md:py-2",
        isChecked
          ? "bg-[color-mix(in_srgb,var(--accent-green)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent-green)_9%,transparent)]"
          : "hover:bg-[var(--bg-elevated)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!canManage || busy}
        aria-pressed={isChecked}
        aria-label={isChecked ? "Mark as not done" : "Mark as done"}
        className={cn(
          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border transition-all duration-200 active:scale-95",
          isChecked
            ? "border-[var(--accent-green)] bg-[var(--accent-green)] text-[var(--bg-base)] shadow-sm"
            : "border-[var(--border-strong)] bg-transparent text-transparent",
          canManage && !busy
            ? "hover:border-[var(--accent-green)] hover:bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)]"
            : "cursor-not-allowed opacity-70",
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "break-words text-sm",
            isChecked
              ? "text-[var(--text-tertiary)] line-through"
              : "text-[var(--text-primary)]",
          )}
        >
          {step.title}
        </span>
        {isChecked && step.completedBy && step.completedAt ? (
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {step.completedBy.name}
            <span className="mx-1.5">,</span>
            {formatTimestamp(new Date(step.completedAt))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
