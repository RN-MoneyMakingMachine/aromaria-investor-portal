import type { ReportType } from "@prisma/client";

import { cn } from "@/lib/utils";
import {
  listScheduledDeliveries,
  REPORT_CADENCE,
  type ScheduledDelivery,
} from "@/lib/data/report-cadence";

const TYPE_TONE: Partial<Record<ReportType, string>> = {
  WEEKLY_BANK_STATEMENT: "var(--accent-blue)",
  MONTHLY_OPERATING: "var(--accent-green)",
  QUARTERLY_BOARD: "var(--accent-amber)",
  QUARTERLY_INVESTOR: "var(--accent-amber)",
  ANNUAL_AUDITED: "var(--metal-mid)",
  ANNUAL_OPERATING_PLAN: "var(--metal-mid)",
};

export type CadenceCalendarReport = {
  id: string;
  type: ReportType;
  dueDate: Date | null;
  publishedAt: Date;
  status: "DRAFT" | "DELIVERED" | "ACKNOWLEDGED" | "ACTION_REQUIRED";
};

function dotToneForStatus(
  scheduled: ScheduledDelivery,
  reports: CadenceCalendarReport[],
  now: Date,
): { tone: string; statusLabel: string } {
  // Match a report of this type within +/- 7 days of the scheduled due date.
  const window = 7 * 24 * 60 * 60 * 1000;
  const match = reports.find(
    (r) =>
      r.type === scheduled.type &&
      Math.abs(r.publishedAt.getTime() - scheduled.dueDate.getTime()) <= window,
  );

  if (match) {
    if (match.status === "ACKNOWLEDGED")
      return { tone: "var(--accent-blue)", statusLabel: "Acknowledged" };
    const late =
      match.publishedAt.getTime() > scheduled.dueDate.getTime() + 24 * 3600 * 1000;
    return late
      ? { tone: "var(--accent-amber)", statusLabel: "Delivered late" }
      : { tone: "var(--accent-green)", statusLabel: "Delivered on time" };
  }

  if (scheduled.dueDate.getTime() < now.getTime() - 24 * 3600 * 1000) {
    return { tone: "var(--accent-red)", statusLabel: "Overdue" };
  }
  return {
    tone: TYPE_TONE[scheduled.type] ?? "var(--metal-mid)",
    statusLabel: "Scheduled",
  };
}

export function CadenceCalendar({
  reports,
  windowDays = 90,
  now = new Date(),
}: {
  reports: CadenceCalendarReport[];
  windowDays?: number;
  now?: Date;
}) {
  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - 7);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + windowDays);
  const totalMs = windowEnd.getTime() - windowStart.getTime();

  const deliveries = listScheduledDeliveries(windowStart, windowEnd);

  // Bucket by track for vertical rows.
  const byType = new Map<ReportType, ScheduledDelivery[]>();
  for (const d of deliveries) {
    if (!byType.has(d.type)) byType.set(d.type, []);
    byType.get(d.type)!.push(d);
  }

  const monthMarkers: { date: Date; left: number }[] = [];
  const cursor = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
  while (cursor <= windowEnd) {
    if (cursor >= windowStart) {
      const left = ((cursor.getTime() - windowStart.getTime()) / totalMs) * 100;
      monthMarkers.push({ date: new Date(cursor), left });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const nowLeft = ((now.getTime() - windowStart.getTime()) / totalMs) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Cadence calendar · next {windowDays} days
        </span>
        <span className="tabular font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {windowStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })} —{" "}
          {windowEnd.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {REPORT_CADENCE.map((track) => {
          const rowDeliveries = byType.get(track.type) ?? [];
          return (
            <div key={track.type} className="flex items-center gap-3">
              <span className="w-44 shrink-0 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                {track.label}
              </span>
              <div className="relative h-6 flex-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                {monthMarkers.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full w-px bg-[var(--border-subtle)]"
                    style={{ left: `${m.left}%` }}
                  />
                ))}
                <div
                  className="absolute top-0 h-full w-px bg-[var(--text-tertiary)]"
                  style={{ left: `${nowLeft}%` }}
                  title="Today"
                />
                {rowDeliveries.map((d, i) => {
                  const left = ((d.dueDate.getTime() - windowStart.getTime()) / totalMs) * 100;
                  const { tone, statusLabel } = dotToneForStatus(d, reports, now);
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--bg-base)]"
                      style={{ left: `${left}%`, background: tone }}
                      title={`${track.label} · ${d.dueDate.toLocaleDateString()} · ${statusLabel}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        <LegendDot tone="var(--accent-green)" label="On time" />
        <LegendDot tone="var(--accent-amber)" label="Late" />
        <LegendDot tone="var(--accent-red)" label="Overdue" />
        <LegendDot tone="var(--accent-blue)" label="Acknowledged" />
        <LegendDot tone="var(--metal-mid)" label="Scheduled" />
      </div>
    </div>
  );
}

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5")}>
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: tone }}
      />
      {label}
    </span>
  );
}
