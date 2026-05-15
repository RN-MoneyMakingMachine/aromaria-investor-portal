import type { ReportType } from "@prisma/client";

// Reporting Policy cadence definitions. Each entry knows how to generate
// expected due dates inside a given window. Used by the CadenceCalendar to
// render the next 90 days of scheduled report deliveries.

export type CadenceTrack = {
  type: ReportType;
  label: string;
  rule:
    | { kind: "weekly"; dayOfWeek: number } // 0 = Sunday … 1 = Monday
    | { kind: "monthly"; dayOfMonth: number }
    | { kind: "quarterly"; daysAfterClose: number }
    | { kind: "annual"; month: number; day: number }; // month: 0-indexed
};

export const REPORT_CADENCE: CadenceTrack[] = [
  {
    type: "WEEKLY_BANK_STATEMENT",
    label: "Weekly Bank Statement",
    rule: { kind: "weekly", dayOfWeek: 1 },
  },
  {
    type: "MONTHLY_OPERATING",
    label: "Monthly Operating Report",
    rule: { kind: "monthly", dayOfMonth: 15 },
  },
  {
    type: "QUARTERLY_BOARD",
    label: "Quarterly Board Pack",
    rule: { kind: "quarterly", daysAfterClose: 45 },
  },
  {
    type: "QUARTERLY_INVESTOR",
    label: "Quarterly Investor Pack",
    rule: { kind: "quarterly", daysAfterClose: 45 },
  },
  {
    type: "ANNUAL_AUDITED",
    label: "Annual Audited Financials",
    rule: { kind: "annual", month: 2, day: 31 }, // 31 Mar (90 days after Dec close)
  },
  {
    type: "ANNUAL_OPERATING_PLAN",
    label: "Annual Operating Plan",
    rule: { kind: "annual", month: 11, day: 15 }, // mid-December, before Jan 1 fiscal year start
  },
];

export type ScheduledDelivery = {
  type: ReportType;
  label: string;
  dueDate: Date;
};

function endOfQuarter(year: number, qIndex: number): Date {
  // qIndex 0..3, returns last day of Mar/Jun/Sep/Dec
  const monthEnd = qIndex * 3 + 3; // 3,6,9,12
  return new Date(year, monthEnd, 0); // day 0 of next month = last day
}

export function listScheduledDeliveries(
  windowStart: Date,
  windowEnd: Date,
): ScheduledDelivery[] {
  const out: ScheduledDelivery[] = [];

  for (const track of REPORT_CADENCE) {
    if (track.rule.kind === "weekly") {
      const d = new Date(windowStart);
      while (d <= windowEnd) {
        if (d.getDay() === track.rule.dayOfWeek) {
          out.push({ type: track.type, label: track.label, dueDate: new Date(d) });
        }
        d.setDate(d.getDate() + 1);
      }
    } else if (track.rule.kind === "monthly") {
      const cursor = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
      while (cursor <= windowEnd) {
        const candidate = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          track.rule.dayOfMonth,
        );
        if (candidate >= windowStart && candidate <= windowEnd) {
          out.push({ type: track.type, label: track.label, dueDate: candidate });
        }
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else if (track.rule.kind === "quarterly") {
      for (let year = windowStart.getFullYear() - 1; year <= windowEnd.getFullYear() + 1; year++) {
        for (let q = 0; q < 4; q++) {
          const close = endOfQuarter(year, q);
          const candidate = new Date(close);
          candidate.setDate(candidate.getDate() + track.rule.daysAfterClose);
          if (candidate >= windowStart && candidate <= windowEnd) {
            out.push({ type: track.type, label: track.label, dueDate: candidate });
          }
        }
      }
    } else if (track.rule.kind === "annual") {
      for (let year = windowStart.getFullYear() - 1; year <= windowEnd.getFullYear() + 1; year++) {
        const candidate = new Date(year, track.rule.month, track.rule.day);
        if (candidate >= windowStart && candidate <= windowEnd) {
          out.push({ type: track.type, label: track.label, dueDate: candidate });
        }
      }
    }
  }

  return out.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
