import Link from "next/link";
import { ArrowRight, FileSearch } from "lucide-react";
import type { InformationRequestStatus, Side } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/portal/progress-bar";

const STATUS_LABEL: Record<InformationRequestStatus, string> = {
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  DECLINED: "Declined",
};

const STATUS_TONE: Record<InformationRequestStatus, string> = {
  SUBMITTED: "var(--text-tertiary)",
  ACKNOWLEDGED: "var(--accent-blue)",
  IN_PROGRESS: "var(--accent-amber)",
  DELIVERED: "var(--accent-green)",
  DECLINED: "var(--accent-red)",
};

export function InformationRequestPanel({
  used,
  cap,
  quarterLabel,
  recent,
  canCreate,
}: {
  used: number;
  cap: number;
  quarterLabel: string;
  recent: {
    id: string;
    subject: string;
    status: InformationRequestStatus;
    createdAt: Date;
    author: { name: string; side: Side };
  }[];
  canCreate: boolean;
}) {
  const percent = cap === 0 ? 0 : Math.min(100, Math.round((used / cap) * 100));
  const tone = used >= cap ? "amber" : "green";

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Information requests
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-xl font-light tabular leading-none text-[var(--text-primary)]">
              {used}
              <span className="text-[var(--text-tertiary)]"> of {cap}</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              {quarterLabel}
            </span>
          </div>
          <ProgressBar value={percent} tone={tone} />
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Substantive requests · SLA 3 BD ack, 30 BD delivery
          </p>
        </div>

        {canCreate ? (
          <Link
            href="/chambers/reporting/information-requests/new"
            className="inline-flex items-center justify-center gap-2 self-start rounded-sm border border-[var(--text-secondary)] px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            Make a request
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}

        {recent.length > 0 ? (
          <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
            {recent.slice(0, 4).map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-[var(--text-primary)] line-clamp-2">
                    {r.subject}
                  </span>
                  <span
                    className="shrink-0 text-[10px] uppercase tracking-widest"
                    style={{ color: STATUS_TONE[r.status] }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  {r.author.name} · {r.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            No requests yet this quarter.
          </p>
        )}

        <Link
          href="/chambers/reporting/information-requests"
          className="inline-flex items-center gap-2 self-start text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          All requests
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
