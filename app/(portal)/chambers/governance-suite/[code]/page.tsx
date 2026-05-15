import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ListChecks } from "lucide-react";

import { AdoptionProgress } from "@/components/portal/adoption-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isAdmin } from "@/lib/rbac";
import { requireUser } from "@/lib/session";
import { getGovernanceDocument } from "@/lib/services/governance-suite";

const AUTHORITY_MATRIX_LINKS = [
  {
    label: "Recent Decisions Log",
    description: "Material commercial decisions taken under the matrix.",
    href: "/chambers/decisions",
  },
  {
    label: "Reserved Matters Consent Record",
    description: "Tier 1 and Tier 2 votes captured at Board meetings.",
    href: "/chambers/decisions?zone=tier1",
  },
  {
    label: "Emergency Authority Log",
    description: "Section 9.6 invocations and post-action notifications.",
    href: "/chambers/decisions?zone=emergency",
  },
  {
    label: "Quarterly Threshold Review Record",
    description: "15% corridor monitoring and rebalancing notes.",
    href: "/chambers/decisions?zone=threshold",
  },
] as const;

export default async function GovernanceDocumentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await requireUser();
  const { code } = await params;
  const doc = await getGovernanceDocument(code);
  if (!doc) notFound();

  const completed = doc.steps.filter((s) => s.completedAt).length;

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href="/chambers/governance-suite"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Governance Suite
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {doc.section}
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
          {doc.short}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {doc.deliverableName} · {completed} of {doc.steps.length} adoption
          items completed
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:p-8">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Document
              </span>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                {doc.description}
              </p>
              <Separator className="my-2" />
              <Link
                href={`/deliverables/item/${doc.deliverableId}`}
                className="inline-flex items-center gap-2 self-start text-[10px] uppercase tracking-widest text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Open full deliverable record
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {doc.code === "PR-17" ? (
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 md:p-8">
                <div className="flex items-center gap-3">
                  <ListChecks className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    Authority Matrix · Operational Records
                  </span>
                </div>
                <ul className="flex flex-col divide-y divide-[var(--border-subtle)]">
                  {AUTHORITY_MATRIX_LINKS.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group flex items-start justify-between gap-4 py-4 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-[var(--text-primary)] transition-colors group-hover:text-[var(--text-primary)]">
                            {link.label}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)]">
                            {link.description}
                          </span>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--text-primary)]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div>
          {doc.steps.length > 0 ? (
            <AdoptionProgress
              deliverableId={doc.deliverableId}
              canManage={isAdmin(user)}
              steps={doc.steps.map((s) => ({
                index: s.index,
                title: s.title,
                completedAt: s.completedAt ? s.completedAt.toISOString() : null,
                completedBy: s.completedBy,
              }))}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-2 p-5 md:p-6">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  Adoption progress
                </span>
                <p className="text-xs text-[var(--text-tertiary)]">
                  No adoption checklist defined for this document yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
