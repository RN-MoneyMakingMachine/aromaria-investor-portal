import { redirect } from "next/navigation";

import { BulkImportForm } from "@/components/portal/bulk-import-form";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

export default async function AdoptionImportPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/welcome");

  const deliverables = await prisma.deliverable.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <div className="flex flex-col gap-8 py-12">
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Admin
            </span>
            <h1 className="font-serif text-2xl font-light tracking-tight text-[var(--text-primary)]">
              Bulk import adoption steps
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              Paste one step per line. Blank lines and lines starting with{" "}
              <code className="font-mono">#</code> are ignored. Steps that
              already exist on the deliverable (case-insensitive, trimmed) are
              skipped — so this is safe to re-run.
            </p>
          </div>

          <BulkImportForm
            deliverables={deliverables.map((d) => ({
              id: d.id,
              code: d.code,
              name: d.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
