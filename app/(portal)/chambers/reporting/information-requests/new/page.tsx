import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { isNikaidoFamilyMember, isOmoyInvestor } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

import { NewInformationRequestForm } from "./form";

export default async function NewInformationRequestPage() {
  const user = await requireUser();
  if (!isNikaidoFamilyMember(user) && !isOmoyInvestor(user)) {
    redirect("/chambers/reporting/information-requests");
  }

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href="/chambers/reporting/information-requests"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Information requests
        </Link>
      </div>

      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="flex flex-col gap-6 p-6 md:p-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
              Reporting Policy · Information request
            </span>
            <h1 className="font-serif text-2xl font-light tracking-tight text-[var(--text-primary)]">
              New information request
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              Acknowledged within 3 business days, delivered within 30 business
              days. Substantive requests count toward the quarterly cap of 4.
            </p>
          </div>
          <NewInformationRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
