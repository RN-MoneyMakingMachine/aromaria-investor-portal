import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { canEdit } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

import { NewDecisionForm } from "./new-decision-form";

export default async function NewDecisionPage() {
  const user = await requireUser();
  if (!canEdit(user)) redirect("/chambers/decisions");

  const owners = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-10 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <Link
            href="/chambers/decisions"
            className="hover:text-[var(--text-secondary)]"
          >
            Commercial Decisions
          </Link>{" "}
          / New
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)]">
          Record a decision
        </h1>
      </header>

      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="p-5 md:p-8">
          <NewDecisionForm owners={owners} />
        </CardContent>
      </Card>
    </div>
  );
}
