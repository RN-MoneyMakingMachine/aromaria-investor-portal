import { redirect } from "next/navigation";

import { PhasePlaceholder } from "@/components/portal/placeholder";
import { canSeeShareholderChamber } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

export default async function ShareholderChamberPage() {
  const user = await requireUser();
  if (!canSeeShareholderChamber(user)) redirect("/welcome");

  return (
    <PhasePlaceholder
      eyebrow="Partner-Only"
      title="Shareholder Chamber"
      body="Cap table, ownership records, related-party allowances, and shareholder workflows. Coming in the next chamber phase."
    />
  );
}
