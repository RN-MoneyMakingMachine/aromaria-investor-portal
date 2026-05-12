import { cn } from "@/lib/utils";

export type ProgressTone = "metal" | "green" | "amber" | "red" | "blue";

export function ProgressBar({
  value,
  tone = "metal",
  className,
}: {
  value: number;
  tone?: ProgressTone;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const fillClass = {
    metal:
      "bg-gradient-to-r from-[var(--metal-mid)] to-[var(--metal-light)]",
    green: "bg-[var(--accent-green)]",
    amber: "bg-[var(--accent-amber)]",
    red: "bg-[var(--accent-red)]",
    blue: "bg-[var(--accent-blue)]",
  }[tone];

  return (
    <div
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]",
        className,
      )}
    >
      <div
        className={cn("h-full transition-all duration-500", fillClass)}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function ProgressHeadline({
  label,
  completed,
  total,
  tone = "metal",
  hint,
}: {
  label: string;
  completed: number;
  total: number;
  tone?: ProgressTone;
  hint?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {label}
        </span>
        <span className="tabular font-mono text-xs text-[var(--text-secondary)]">
          {completed} of {total}
        </span>
      </div>
      <ProgressBar value={percent} tone={tone} />
      {hint ? (
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
