import { redirect } from "next/navigation";

import { PhasePlaceholder } from "@/components/portal/placeholder";
import { requireUser } from "@/lib/session";
import { isAdmin } from "@/lib/rbac";

export default async function AdminPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/welcome");

  return (
    <PhasePlaceholder
      eyebrow="Phase 5"
      title="Admin"
      body="User management and the audit log viewer with CSV export arrive in the polish phase."
    />
  );
}
