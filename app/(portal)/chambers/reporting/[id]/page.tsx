import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { ReportTypePill } from "@/components/portal/pills";
import { formatTimestamp } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getReport } from "@/lib/services/reports";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

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
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Published {formatTimestamp(report.publishedAt)}
          </span>
        </div>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          {report.title}
        </h1>
      </header>

      <Card>
        <CardContent className="p-8">
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
    </div>
  );
}
