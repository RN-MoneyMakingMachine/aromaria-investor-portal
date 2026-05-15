import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CadenceCalendar } from "@/components/portal/cadence-calendar";
import { ForecastDisciplineBanner } from "@/components/portal/forecast-discipline-banner";
import { InformationRequestPanel } from "@/components/portal/info-request-panel";
import { ReportFilters } from "@/components/portal/report-filters";
import { canEdit, isNikaidoFamilyMember, isOmoyInvestor } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import {
  getQuarterlySubstantiveCount,
  listInformationRequests,
} from "@/lib/services/information-requests";
import { listReports } from "@/lib/services/reports";

const SUBSECTION_CARDS = [
  {
    href: "/chambers/reporting/material-events",
    eyebrow: "Event-driven",
    title: "Material Event Disclosures",
  },
  {
    href: "/chambers/reporting/monthly",
    eyebrow: "Cadence",
    title: "Monthly Template",
  },
  {
    href: "/chambers/reporting/quarterly",
    eyebrow: "Cadence",
    title: "Quarterly Templates",
  },
  {
    href: "/chambers/reporting/annual",
    eyebrow: "Cadence",
    title: "Annual Template",
  },
] as const;

export default async function ReportingListPage() {
  const user = await requireUser();
  const reports = await listReports();
  const [requests, counter] = await Promise.all([
    listInformationRequests(10),
    getQuarterlySubstantiveCount(),
  ]);

  const canRequest = isNikaidoFamilyMember(user) || isOmoyInvestor(user);
  const calendarReports = reports.map((r) => ({
    id: r.id,
    type: r.type,
    dueDate: r.dueDate,
    publishedAt: r.publishedAt,
    status: r.status,
  }));
  const filterEntries = reports.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    periodLabel: r.periodLabel,
    publishedAt: r.publishedAt.toISOString(),
    status: r.status,
  }));

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-wrap items-end justify-between gap-6">
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
          <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
            Reporting
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            All financial, growth, and operational reports delivered to the
            partnership.
          </p>
        </div>
        {canEdit(user) ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/chambers/reporting/new">New report</Link>
          </Button>
        ) : null}
      </header>

      <ForecastDisciplineBanner trigger={null} />

      <Card>
        <CardContent className="p-5 md:p-6">
          <CadenceCalendar reports={calendarReports} />
        </CardContent>
      </Card>

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SUBSECTION_CARDS.map((s) => (
              <Link key={s.href} href={s.href} className="group block">
                <Card className="h-full transition-colors duration-200 group-hover:border-[var(--border-strong)]">
                  <CardContent className="flex h-full items-start justify-between gap-3 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {s.eyebrow}
                      </span>
                      <span className="font-serif text-base font-light leading-tight tracking-tight text-[var(--text-primary)]">
                        {s.title}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <ReportFilters reports={filterEntries} />
        </div>

        <aside className="flex flex-col gap-6">
          <InformationRequestPanel
            used={counter.used}
            cap={counter.cap}
            quarterLabel={counter.quarterLabel}
            recent={requests.map((r) => ({
              id: r.id,
              subject: r.subject,
              status: r.status,
              createdAt: r.createdAt,
              author: r.author,
            }))}
            canCreate={canRequest}
          />
        </aside>
      </div>
    </div>
  );
}
