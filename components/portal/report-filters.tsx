"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ReportType } from "@prisma/client";

import { ReportTypePill } from "@/components/portal/pills";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/dates";
import { cn } from "@/lib/utils";

const FILTER_GROUPS: { type: ReportType | "ALL"; label: string }[] = [
  { type: "ALL", label: "All" },
  { type: "WEEKLY_BANK_STATEMENT", label: "Weekly" },
  { type: "MONTHLY_OPERATING", label: "Monthly" },
  { type: "QUARTERLY_BOARD", label: "Quarterly Board" },
  { type: "QUARTERLY_INVESTOR", label: "Quarterly Investor" },
  { type: "ANNUAL_AUDITED", label: "Annual Audited" },
  { type: "ANNUAL_OPERATING_PLAN", label: "Annual Operating Plan" },
  { type: "MATERIAL_EVENT_DISCLOSURE", label: "Material Event" },
  { type: "UPSIDE_NOTICE", label: "Upside Notice" },
];

export type ReportListEntry = {
  id: string;
  type: ReportType;
  title: string;
  periodLabel: string;
  publishedAt: string; // ISO
  status: "DRAFT" | "DELIVERED" | "ACKNOWLEDGED" | "ACTION_REQUIRED";
};

const STATUS_LABEL: Record<ReportListEntry["status"], string> = {
  DRAFT: "Draft",
  DELIVERED: "Delivered",
  ACKNOWLEDGED: "Acknowledged",
  ACTION_REQUIRED: "Action required",
};

const STATUS_TONE: Record<ReportListEntry["status"], string> = {
  DRAFT: "var(--text-tertiary)",
  DELIVERED: "var(--accent-green)",
  ACKNOWLEDGED: "var(--accent-blue)",
  ACTION_REQUIRED: "var(--accent-amber)",
};

export function ReportFilters({ reports }: { reports: ReportListEntry[] }) {
  const [activeType, setActiveType] = useState<ReportType | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (activeType !== "ALL" && r.type !== activeType) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.periodLabel.toLowerCase().includes(q)
      );
    });
  }, [reports, activeType, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_GROUPS.map((f) => (
            <button
              key={f.type}
              type="button"
              onClick={() => setActiveType(f.type)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors",
                activeType === f.type
                  ? "border-[var(--text-secondary)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative flex w-full items-center sm:w-72">
          <Search className="absolute left-2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports"
            className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1.5 pl-7 pr-2 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--text-secondary)]"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-xs text-[var(--text-tertiary)]">
            No reports match the current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/chambers/reporting/${r.id}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-[var(--metal-mid)]">
                <CardContent className="flex items-center justify-between gap-6 p-5 md:p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <ReportTypePill type={r.type} />
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {r.periodLabel}
                      </span>
                    </div>
                    <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
                      {r.title}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <span
                      className="text-[10px] uppercase tracking-widest"
                      style={{ color: STATUS_TONE[r.status] }}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                      {formatTimestamp(new Date(r.publishedAt))}
                    </span>
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
