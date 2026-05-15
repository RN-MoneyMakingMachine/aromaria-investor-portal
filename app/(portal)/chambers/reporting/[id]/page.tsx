import Link from "next/link";
import { notFound } from "next/navigation";

import { AcknowledgeReportButton } from "@/components/portal/acknowledge-report-button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportTypePill } from "@/components/portal/pills";
import { formatTimestamp } from "@/lib/dates";
import { isNikaidoFamilyMember, isOmoyInvestor } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { getReport } from "@/lib/services/reports";
import { prisma } from "@/lib/db";

const STATUS_LABEL = {
  DRAFT: "Draft",
  DELIVERED: "Delivered",
  ACKNOWLEDGED: "Acknowledged",
  ACTION_REQUIRED: "Action required",
} as const;

const STATUS_TONE = {
  DRAFT: "var(--text-tertiary)",
  DELIVERED: "var(--accent-green)",
  ACKNOWLEDGED: "var(--accent-blue)",
  ACTION_REQUIRED: "var(--accent-amber)",
} as const;

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const ackUser = report.acknowledgedById
    ? await prisma.user.findUnique({
        where: { id: report.acknowledgedById },
        select: { name: true },
      })
    : null;

  const canAck = isNikaidoFamilyMember(user) || isOmoyInvestor(user);
  const alreadyAcknowledged = !!report.acknowledgedAt;

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers/reporting"
            className="hover:text-[var(--text-secondary)]"
          >
            Reporting
          </Link>{" "}
          / Detail
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ReportTypePill type={report.type} />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            {report.periodLabel}
          </span>
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: STATUS_TONE[report.status] }}
          >
            {STATUS_LABEL[report.status]}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Published {formatTimestamp(report.publishedAt)}
          </span>
        </div>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
          {report.title}
        </h1>
      </header>

      {report.status === "ACTION_REQUIRED" && report.actionLabel ? (
        <Card className="border-l-2 border-l-[var(--accent-amber)]">
          <CardContent className="flex items-center justify-between gap-4 p-5 md:p-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-[var(--accent-amber)]">
                Action required
              </span>
              <span className="text-sm text-[var(--text-primary)]">
                {report.actionLabel}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-5 md:p-8">
          {report.summary ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {report.summary}
            </p>
          ) : (
            <p className="text-sm italic text-[var(--text-tertiary)]">
              No summary recorded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 md:p-6">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Acknowledgment
          </span>
          {alreadyAcknowledged ? (
            <p className="text-sm text-[var(--accent-blue)]">
              Acknowledged by {ackUser?.name ?? "investor"} on{" "}
              {formatTimestamp(report.acknowledgedAt!)}.
            </p>
          ) : canAck ? (
            <>
              <p className="text-xs text-[var(--text-tertiary)]">
                Once acknowledged, this report is sealed against further
                edits and the acknowledgement enters the permanent audit log.
              </p>
              <AcknowledgeReportButton id={report.id} />
            </>
          ) : (
            <p className="text-xs text-[var(--text-tertiary)]">
              Only Nikaido family or Omoy named individuals can acknowledge.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
