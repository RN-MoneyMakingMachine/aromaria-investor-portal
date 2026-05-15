import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReportTypePill } from "@/components/portal/pills";
import { formatTimestamp } from "@/lib/dates";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { listReports } from "@/lib/services/reports";

const REPORTING_SECTIONS = [
  {
    href: "/chambers/reporting/monthly",
    eyebrow: "Cadence",
    title: "Monthly Report Template",
  },
  {
    href: "/chambers/reporting/quarterly",
    eyebrow: "Cadence",
    title: "Quarterly",
  },
  {
    href: "/chambers/reporting/annual",
    eyebrow: "Cadence",
    title: "Annual",
  },
] as const;

export default async function ReportingListPage() {
  const user = await requireUser();
  const reports = await listReports();

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            <Link
              href="/chambers"
              className="hover:text-[var(--text-secondary)]"
            >
              Chambers
            </Link>{" "}
            / Reporting
          </p>
          <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
            Reporting
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {reports.length === 0
              ? "No reports recorded yet."
              : `${reports.length} report${reports.length === 1 ? "" : "s"} on file.`}
          </p>
        </div>
        {canEdit(user) ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/chambers/reporting/new">New report</Link>
          </Button>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTING_SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="group block">
            <Card className="h-full transition-colors duration-200 group-hover:border-[var(--border-strong)]">
              <CardContent className="flex h-full items-start justify-between gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    {s.eyebrow}
                  </span>
                  <span className="font-serif text-xl font-light tracking-tight text-[var(--text-primary)]">
                    {s.title}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-[var(--text-secondary)]">
            The first report will appear here once recorded.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/chambers/reporting/${r.id}`}
              className="group block"
            >
              <Card className="transition-colors group-hover:border-[var(--metal-mid)]">
                <CardContent className="flex items-center justify-between gap-6 p-6">
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
                  <div className="text-right text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    {formatTimestamp(r.publishedAt)}
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
