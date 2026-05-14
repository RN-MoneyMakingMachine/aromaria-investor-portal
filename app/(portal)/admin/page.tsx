import { redirect } from "next/navigation";

import { PhasePlaceholder } from "@/components/portal/placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { isAdmin } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { getUploadDirInfo } from "@/lib/services/files";
import { checkSoffice } from "@/lib/services/pdf-convert";

export default async function AdminPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/welcome");

  const [storage, soffice] = await Promise.all([
    getUploadDirInfo(),
    checkSoffice(),
  ]);

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

      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="flex flex-col gap-3 p-6">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            LibreOffice (PDF conversion)
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
              Status
            </dt>
            <dd
              className={
                soffice.ok
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }
            >
              {soffice.ok ? "available" : "not available"}
            </dd>
            <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
              Binary
            </dt>
            <dd className="font-mono text-[var(--text-primary)]">
              {soffice.binary}
            </dd>
            {soffice.version ? (
              <>
                <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
                  Version
                </dt>
                <dd className="text-[var(--text-primary)]">
                  {soffice.version}
                </dd>
              </>
            ) : null}
            {soffice.error ? (
              <>
                <dt className="uppercase tracking-widest text-[var(--text-tertiary)]">
                  Error
                </dt>
                <dd className="font-mono text-[var(--accent-red)] whitespace-pre-wrap break-words">
                  {soffice.error}
                </dd>
              </>
            ) : null}
          </dl>
          {!soffice.ok ? (
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent-red)]">
              Download as PDF / View in browser will fail for Word, Excel, and PowerPoint files until this is fixed.
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
