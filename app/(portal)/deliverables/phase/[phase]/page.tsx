import Link from "next/link";
import { notFound } from "next/navigation";
import type { Category, Phase, Status } from "@prisma/client";
import { ArrowLeft, Check, FileText, MessageSquare } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProgressBar } from "@/components/portal/progress-bar";
import { PriorityPill, StatusPill } from "@/components/portal/pills";
import {
  CATEGORY_LABEL,
  PHASE_LABEL,
  STATUS_LABEL,
  STATUS_LABEL_SHORT,
} from "@/lib/constants";
import { listDeliverablesByPhase } from "@/lib/services/deliverables";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const PHASES = [
  "WIRE_CONDITION",
  "COMMITTED",
  "POST_SIGNING",
  "COMPLETED_PRE_60D",
] as const;

const CATEGORY_VALUES: Category[] = [
  "GOVERNANCE",
  "REPORTING",
  "LEGAL",
  "BUSINESS",
  "STRUCTURE",
  "HR",
  "FINANCIAL",
  "RISK",
  "FUNDING",
];

const STATUS_VALUES: Status[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED_FOR_REVIEW",
  "IN_REVIEW",
  "BLOCKED",
  "COMPLETED",
];

const APPROVAL_VALUES = ["BOTH", "NIKAIDO", "OMOY", "NEITHER"] as const;

const PHASE_DESCRIPTIONS: Record<string, string> = {
  WIRE_CONDITION:
    "Three commitments required before the wire. Critical until all three are completed.",
  COMMITTED:
    "Eight commitments aligned for Day 60. Implementation timelines run from one to six months.",
  POST_SIGNING:
    "Four legal actions to execute within statutory windows after signing.",
  COMPLETED_PRE_60D:
    "Sixteen commitments delivered before the 60 day reference. Held in the record.",
};

type Params = { phase: string };
type SearchParams = {
  category?: string;
  status?: string;
  approval?: string;
};

export default async function PhasePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const { phase: raw } = await params;
  const upper = raw.toUpperCase();
  if (!(PHASES as readonly string[]).includes(upper)) notFound();
  const phase = upper as Phase;

  const sp = await searchParams;
  const categoryFilter =
    sp.category && CATEGORY_VALUES.includes(sp.category as Category)
      ? (sp.category as Category)
      : null;
  const statusFilter =
    sp.status && STATUS_VALUES.includes(sp.status as Status)
      ? (sp.status as Status)
      : null;
  const approvalFilter =
    sp.approval && (APPROVAL_VALUES as readonly string[]).includes(sp.approval)
      ? (sp.approval as (typeof APPROVAL_VALUES)[number])
      : null;

  const items = await listDeliverablesByPhase(phase);

  const filtered = items.filter((d) => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    if (approvalFilter) {
      const hasNikaido = d.approvals.some((a) => a.side === "NIKAIDO");
      const hasOmoy = d.approvals.some((a) => a.side === "OMOY");
      if (approvalFilter === "BOTH" && !(hasNikaido && hasOmoy)) return false;
      if (approvalFilter === "NIKAIDO" && !hasNikaido) return false;
      if (approvalFilter === "OMOY" && !hasOmoy) return false;
      if (approvalFilter === "NEITHER" && (hasNikaido || hasOmoy)) return false;
    }
    return true;
  });

  const total = items.length;
  const completed = items.filter((d) => d.status === "COMPLETED").length;
  const progressSum = items.reduce((acc, d) => acc + d.progressPercent, 0);
  const percent = total === 0 ? 0 : Math.round(progressSum / total);

  const buildHref = (overrides: Partial<SearchParams>) => {
    const next: Record<string, string> = {};
    if (categoryFilter && overrides.category !== "") next.category = categoryFilter;
    if (statusFilter && overrides.status !== "") next.status = statusFilter;
    if (approvalFilter && overrides.approval !== "")
      next.approval = approvalFilter;
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next[k] = v;
      else delete next[k];
    }
    const qs = new URLSearchParams(next).toString();
    return `/deliverables/phase/${raw}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href="/deliverables?view=phase"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          All phases
        </Link>
      </div>

      <header className="flex flex-col gap-4">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Phase
        </p>
        <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
          {PHASE_LABEL[phase]}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
          {PHASE_DESCRIPTIONS[phase]}
        </p>
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <span className="tabular font-mono">
            {completed} of {total} completed
          </span>
          <span className="text-[var(--text-tertiary)]">,</span>
          <span className="tabular font-mono">{percent}%</span>
        </div>
        <ProgressBar value={percent} />
      </header>

      <FilterBar
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        approvalFilter={approvalFilter}
        buildHref={buildHref}
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
              No deliverables match the current filters.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-6 py-3 text-left font-medium">Name</th>
                  <th className="px-3 py-3 text-left font-medium">Category</th>
                  <th className="px-3 py-3 text-left font-medium">Priority</th>
                  <th className="px-3 py-3 text-left font-medium">Status</th>
                  <th className="px-3 py-3 text-center font-medium">Approvals</th>
                  <th className="px-3 py-3 text-right font-medium">Activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const hasNikaido = d.approvals.some(
                    (a) => a.side === "NIKAIDO",
                  );
                  const hasOmoy = d.approvals.some((a) => a.side === "OMOY");
                  return (
                    <tr
                      key={d.id}
                      className={cn(
                        "transition-colors hover:bg-[var(--bg-elevated)]",
                        i !== filtered.length - 1 &&
                          "border-b border-[var(--border-subtle)]",
                      )}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/deliverables/item/${d.id}`}
                          className="block"
                        >
                          <span className="text-[var(--text-primary)] hover:underline">
                            {d.name}
                          </span>
                          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                            {d.code}
                          </p>
                        </Link>
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          href={`/deliverables/${d.category.toLowerCase()}`}
                          className="text-xs text-[var(--text-secondary)] hover:underline"
                        >
                          {CATEGORY_LABEL[d.category]}
                        </Link>
                      </td>
                      <td className="px-3 py-4">
                        <PriorityPill priority={d.priority} />
                      </td>
                      <td className="px-3 py-4">
                        <StatusPill status={d.status} />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <ApprovalDot label="N" filled={hasNikaido} />
                          <ApprovalDot label="O" filled={hasOmoy} />
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <Link
                          href={`/deliverables/item/${d.id}`}
                          className="inline-flex items-center gap-3 text-[var(--text-tertiary)]"
                        >
                          <span className="inline-flex items-center gap-1 tabular font-mono">
                            <MessageSquare className="h-3 w-3" />
                            {d._count.comments}
                          </span>
                          <span className="inline-flex items-center gap-1 tabular font-mono">
                            <FileText className="h-3 w-3" />
                            {d._count.files}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalDot({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      title={label === "N" ? "Nikaido" : "OMOY"}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] uppercase tracking-widest tabular",
        filled
          ? "border-[var(--accent-green)] text-[var(--accent-green)]"
          : "border-[var(--border-subtle)] text-[var(--text-tertiary)]",
      )}
    >
      {filled ? <Check className="h-3 w-3" /> : label}
    </span>
  );
}

function FilterBar({
  categoryFilter,
  statusFilter,
  approvalFilter,
  buildHref,
}: {
  categoryFilter: Category | null;
  statusFilter: Status | null;
  approvalFilter: (typeof APPROVAL_VALUES)[number] | null;
  buildHref: (o: Partial<SearchParams>) => string;
}) {
  const anyActive = categoryFilter || statusFilter || approvalFilter;

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-4">
      <FilterGroup label="Category">
        <FilterChip href={buildHref({ category: "" })} active={!categoryFilter}>
          All
        </FilterChip>
        {CATEGORY_VALUES.map((c) => (
          <FilterChip
            key={c}
            href={buildHref({ category: c })}
            active={categoryFilter === c}
          >
            {CATEGORY_LABEL[c]}
          </FilterChip>
        ))}
      </FilterGroup>

      <Separator orientation="vertical" className="h-6" />

      <FilterGroup label="Status">
        <FilterChip href={buildHref({ status: "" })} active={!statusFilter}>
          All
        </FilterChip>
        {STATUS_VALUES.map((s) => (
          <FilterChip
            key={s}
            href={buildHref({ status: s })}
            active={statusFilter === s}
            title={STATUS_LABEL[s]}
          >
            {STATUS_LABEL_SHORT[s] ?? STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </FilterGroup>

      <Separator orientation="vertical" className="h-6" />

      <FilterGroup label="Approvals">
        <FilterChip href={buildHref({ approval: "" })} active={!approvalFilter}>
          All
        </FilterChip>
        <FilterChip
          href={buildHref({ approval: "BOTH" })}
          active={approvalFilter === "BOTH"}
        >
          Both
        </FilterChip>
        <FilterChip
          href={buildHref({ approval: "NIKAIDO" })}
          active={approvalFilter === "NIKAIDO"}
        >
          Nikaido
        </FilterChip>
        <FilterChip
          href={buildHref({ approval: "OMOY" })}
          active={approvalFilter === "OMOY"}
        >
          OMOY
        </FilterChip>
        <FilterChip
          href={buildHref({ approval: "NEITHER" })}
          active={approvalFilter === "NEITHER"}
        >
          Neither
        </FilterChip>
      </FilterGroup>

      {anyActive ? (
        <Link
          href={buildHref({ category: "", status: "", approval: "" })}
          className="ml-auto text-[10px] uppercase tracking-widest text-[var(--text-secondary)] underline-offset-4 transition-colors hover:text-[var(--text-primary)] hover:underline"
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  title,
  children,
}: {
  href: string;
  active: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "rounded-sm border px-2 py-1 text-[10px] uppercase tracking-widest transition-colors",
        active
          ? "border-[var(--border-strong)] bg-[var(--bg-overlay)] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-tertiary)] hover:border-[var(--border-subtle)] hover:text-[var(--text-secondary)]",
      )}
    >
      {children}
    </Link>
  );
}

