import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

import { NewReportForm } from "./new-report-form";

export default async function NewReportPage() {
  const user = await requireUser();
  if (!canEdit(user)) redirect("/chambers/reporting");

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers/reporting"
            className="hover:text-[var(--text-secondary)]"
          >
            Reporting
          </Link>{" "}
          / New
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          Record a report
        </h1>
      </header>

      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="p-8">
          <NewReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
