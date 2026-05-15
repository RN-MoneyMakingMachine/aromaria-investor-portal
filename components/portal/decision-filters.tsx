"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DecisionStatus, DecisionTier, DecisionZone } from "@prisma/client";

import { DecisionStatusPill } from "@/components/portal/pills";
import { DecisionZonePill } from "@/components/portal/decision-zone-pill";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const ZONE_FILTERS: { value: DecisionZone | "ALL"; label: string }[] = [
  { value: "ALL", label: "All zones" },
  { value: "ZONE_1", label: "Zone 1" },
  { value: "ZONE_2", label: "Zone 2" },
  { value: "ZONE_3", label: "Zone 3" },
  { value: "ZONE_4", label: "Zone 4" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "THRESHOLD", label: "Threshold" },
];

const STATUS_FILTERS: { value: DecisionStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "APPROVED", label: "Approved" },
  { value: "DECLINED", label: "Declined" },
  { value: "IMPLEMENTED", label: "Implemented" },
];

export type DecisionListEntry = {
  id: string;
  title: string;
  summary: string;
  status: DecisionStatus;
  zone: DecisionZone | null;
  tier: DecisionTier | null;
  decidedAt: string | null;
  createdBy: { name: string };
  owner: { name: string } | null;
};

const QUERY_TO_ZONE: Record<string, DecisionZone | "ALL"> = {
  tier1: "ZONE_2",
  tier2: "ZONE_2",
  emergency: "EMERGENCY",
  threshold: "THRESHOLD",
};

export function DecisionFilters({
  decisions,
}: {
  decisions: DecisionListEntry[];
}) {
  const params = useSearchParams();
  const initial = useMemo(() => {
    const z = params.get("zone");
    if (z && QUERY_TO_ZONE[z]) return QUERY_TO_ZONE[z];
    return "ALL" as const;
  }, [params]);

  const [zone, setZone] = useState<DecisionZone | "ALL">(initial);
  const [status, setStatus] = useState<DecisionStatus | "ALL">("ALL");

  useEffect(() => {
    setZone(initial);
  }, [initial]);

  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      if (zone !== "ALL" && d.zone !== zone) return false;
      if (status !== "ALL" && d.status !== status) return false;
      return true;
    });
  }, [decisions, zone, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {ZONE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setZone(f.value)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors",
                zone === f.value
                  ? "border-[var(--text-secondary)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors",
                status === f.value
                  ? "border-[var(--text-secondary)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
            No decisions match the current filter.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/chambers/decisions/${d.id}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-[var(--metal-mid)]">
                <CardContent className="flex items-start justify-between gap-6 p-5 md:p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <DecisionStatusPill status={d.status} />
                      {d.zone ? (
                        <DecisionZonePill zone={d.zone} tier={d.tier} />
                      ) : null}
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {d.owner ? `Owner: ${d.owner.name}` : `Logged by ${d.createdBy.name}`}
                      </span>
                    </div>
                    <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
                      {d.title}
                    </h2>
                    <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
                      {d.summary}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    {d.decidedAt ? (
                      <span>Decided {formatDate(new Date(d.decidedAt))}</span>
                    ) : (
                      <span>Open</span>
                    )}
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
