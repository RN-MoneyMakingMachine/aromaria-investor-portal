import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ReportTypePill } from "@/components/portal/pills";
import { formatTimestamp } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function MaterialEventFeedPage() {
  await requireUser();

  const events = await prisma.report.findMany({
    where: { type: "MATERIAL_EVENT_DISCLOSURE" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href="/chambers/reporting"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Reporting
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Event-driven feed
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
          Material Event Disclosures
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Disclosures filed under Reporting Policy Section 7A — covers six event
          categories, 5-business-day notification window from event occurrence.
        </p>
      </header>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-xs uppercase tracking-widest text-[var(--text-tertiary)]">
            No material events filed yet.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/chambers/reporting/${e.id}`}
              className="group block"
            >
              <Card className="border-l-2 border-l-[var(--accent-red)] transition-colors group-hover:border-[var(--metal-mid)]">
                <CardContent className="flex flex-col gap-2 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <ReportTypePill type={e.type} />
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                      {formatTimestamp(e.publishedAt)}
                    </span>
                  </div>
                  <h2 className="font-serif text-lg font-light tracking-tight text-[var(--text-primary)]">
                    {e.title}
                  </h2>
                  {e.summary ? (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3">
                      {e.summary}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
