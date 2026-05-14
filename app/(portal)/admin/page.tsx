import { redirect } from "next/navigation";

import { PhasePlaceholder } from "@/components/portal/placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { isAdmin } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { getUploadDirInfo } from "@/lib/services/files";

export default async function AdminPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/welcome");

  const storage = await getUploadDirInfo();

  return (
    <div className="flex flex-col gap-8 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="flex flex-col gap-3 p-6">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Storage
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
              UPLOAD_DIR
            </dt>
            <dd
              className={
                storage.configured
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }
            >
              {storage.configured ? "configured" : "using fallback (ephemeral)"}
            </dd>
            <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
              Path
            </dt>
            <dd className="font-mono text-[var(--text-primary)]">
              {storage.path}
            </dd>
            <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
              Mounted
            </dt>
            <dd
              className={
                storage.exists
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }
            >
              {storage.exists ? "yes" : "no"}
            </dd>
          </dl>
          {!storage.configured ? (
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent-red)]">
              Uploads will be lost on every deploy. Attach a Railway volume and set UPLOAD_DIR.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <PhasePlaceholder
        eyebrow="Phase 5"
        title="Admin"
        body="User management and the audit log viewer with CSV export arrive in the polish phase."
      />
    </div>
  );
}
