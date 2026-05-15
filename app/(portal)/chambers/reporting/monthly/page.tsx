import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/session";

export default async function MonthlyReportTemplatePage() {
  await requireUser();
  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers"
            className="hover:text-[var(--text-secondary)]"
          >
            Chambers
          </Link>{" "}
          /{" "}
          <Link
            href="/chambers/reporting"
            className="hover:text-[var(--text-secondary)]"
          >
            Reporting
          </Link>{" "}
          / Monthly
        </p>
        <h1 className="font-serif text-4xl font-light tracking-tight text-[var(--text-primary)]">
          Monthly Report Template
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Monthly cadence. Content for this section is coming soon.
        </p>
      </header>
      <Card>
        <CardContent className="p-10 text-center text-sm text-[var(--text-secondary)]">
          This section is ready to be populated.
        </CardContent>
      </Card>
    </div>
  );
}
