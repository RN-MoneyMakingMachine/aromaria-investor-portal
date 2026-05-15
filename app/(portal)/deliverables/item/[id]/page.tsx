import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AdoptionProgress } from "@/components/portal/adoption-progress";
import { ApprovalToggle } from "@/components/portal/approval-toggle";
import { CommentThread } from "@/components/portal/comment-thread";
import { FileUploader } from "@/components/portal/file-uploader";
import {
  PhasePill,
  PriorityPill,
  StatusPill,
} from "@/components/portal/pills";
import { StatusChanger } from "@/components/portal/status-changer";
import {
  CATEGORY_LABEL,
  ROLE_LABEL,
  SIDE_LABEL,
  STATUS_LABEL,
} from "@/lib/constants";
import { formatDate, formatTimestamp } from "@/lib/dates";
import { listAdoptionSteps } from "@/lib/services/adoption";
import { getDeliverable } from "@/lib/services/deliverables";
import { listDeliverableChains } from "@/lib/services/files";
import { canEdit, isAdmin } from "@/lib/rbac";
import { requireUser } from "@/lib/session";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const deliverable = await getDeliverable(id);
  if (!deliverable) notFound();

  const chains = await listDeliverableChains(deliverable.id);
  const finalChain = chains.find((c) => c.chainHasFinal) ?? null;
  const adoptionSteps = await listAdoptionSteps(deliverable.id, deliverable.code);

  const nikaidoApproval =
    deliverable.approvals.find((a) => a.side === "NIKAIDO") ?? null;
  const omoyApproval =
    deliverable.approvals.find((a) => a.side === "OMOY") ?? null;

  return (
    <div className="flex flex-col gap-10 py-6">
      <div>
        <Link
          href={`/deliverables/${deliverable.category.toLowerCase()}`}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-3 w-3" />
          {CATEGORY_LABEL[deliverable.category]}
        </Link>
      </div>

      <header className="flex flex-col gap-4">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          {deliverable.code}
        </p>
        <h1 className="font-serif text-3xl font-light tracking-tight text-[var(--text-primary)] md:text-4xl">
          {deliverable.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <PhasePill phase={deliverable.phase} />
          <PriorityPill priority={deliverable.priority} />
          <StatusPill status={deliverable.status} />
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-10">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:p-8">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Description, Exhibit A
              </span>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                {deliverable.description}
              </p>
              {deliverable.implementationTimeline ? (
                <>
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                      Implementation timeline
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {deliverable.implementationTimeline}
                    </span>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <section className="grid gap-4 sm:grid-cols-2">
            <ApprovalToggle
              deliverableId={deliverable.id}
              side="NIKAIDO"
              approval={
                nikaidoApproval
                  ? {
                      side: "NIKAIDO",
                      approvedAt: nikaidoApproval.approvedAt,
                      user: {
                        name: nikaidoApproval.user.name,
                        email: nikaidoApproval.user.email,
                      },
                    }
                  : null
              }
              user={user}
            />
            <ApprovalToggle
              deliverableId={deliverable.id}
              side="OMOY"
              approval={
                omoyApproval
                  ? {
                      side: "OMOY",
                      approvedAt: omoyApproval.approvedAt,
                      user: {
                        name: omoyApproval.user.name,
                        email: omoyApproval.user.email,
                      },
                    }
                  : null
              }
              user={user}
            />
          </section>

          {finalChain ? (
            <FinalDocumentCard
              deliverableId={deliverable.id}
              filename={
                finalChain.history.find((h) => h.id === finalChain.finalId)
                  ?.filename ??
                (finalChain.head.id === finalChain.finalId
                  ? finalChain.head.filename
                  : "Final document")
              }
            />
          ) : null}

          <FileUploader
            deliverableId={deliverable.id}
            currentUserId={user.id}
            canEdit={canEdit(user)}
            chains={chains}
          />

          <CommentThread
            deliverableId={deliverable.id}
            currentUserId={user.id}
            comments={deliverable.comments.map((c) => ({
              id: c.id,
              body: c.body,
              parentId: c.parentId,
              createdAt: c.createdAt,
              user: {
                id: c.user.id,
                name: c.user.name,
                side: c.user.side,
                role: c.user.role,
                title: c.user.title,
              },
            }))}
          />

          {adoptionSteps.length > 0 ? (
            <AdoptionProgress
              deliverableId={deliverable.id}
              canManage={isAdmin(user)}
              steps={adoptionSteps.map((s) => ({
                index: s.index,
                title: s.title,
                completedAt: s.completedAt ? s.completedAt.toISOString() : null,
                completedBy: s.completedBy,
              }))}
            />
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col divide-y divide-[var(--border-subtle)] p-0">
              <DetailRow label="Status">
                {canEdit(user) ? (
                  <StatusChanger
                    deliverableId={deliverable.id}
                    currentStatus={deliverable.status}
                  />
                ) : (
                  <span className="text-sm text-[var(--text-primary)]">
                    {STATUS_LABEL[deliverable.status]}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Progress">
                <span className="tabular font-mono text-sm text-[var(--text-primary)]">
                  {deliverable.progressPercent}%
                </span>
              </DetailRow>
              <DetailRow label="Target date">
                <span className="text-sm text-[var(--text-secondary)]">
                  {deliverable.targetDate
                    ? formatDate(deliverable.targetDate)
                    : "Not set"}
                </span>
              </DetailRow>
              <DetailRow label="Owner">
                <span className="text-sm text-[var(--text-secondary)]">
                  {deliverable.ownerId ? "Assigned" : "Unassigned"}
                </span>
              </DetailRow>
              <DetailRow label="Section">
                <span className="text-sm text-[var(--text-secondary)]">
                  {deliverable.sectionRef}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:p-6">
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                Recent activity
              </span>
              {deliverable.auditEvents.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">
                  No activity yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {deliverable.auditEvents.map((e) => (
                    <li key={e.id} className="flex flex-col gap-0.5">
                      <span className="text-xs text-[var(--text-primary)]">
                        {humanAction(e.action)}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                        {e.user?.name ?? "System"}
                        <span className="mx-1.5">,</span>
                        {formatTimestamp(e.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 md:px-6 md:py-4">
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function FinalDocumentCard({
  deliverableId,
  filename,
}: {
  deliverableId: string;
  filename: string;
}) {
  return (
    <Card className="border-[var(--accent-green)]">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-[var(--accent-green)]" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[var(--accent-green)]">
              Final document
            </span>
            <span className="text-sm text-[var(--text-primary)]">
              {filename}
            </span>
          </div>
        </div>
        <a
          href={`/api/deliverables/${deliverableId}/final-document`}
          className="inline-flex items-center gap-2 rounded-sm border border-[var(--accent-green)] px-3 py-1.5 text-[10px] uppercase tracking-widest text-[var(--accent-green)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent-green)_10%,transparent)]"
        >
          <Download className="h-3 w-3" />
          Download final
        </a>
      </CardContent>
    </Card>
  );
}

function humanAction(action: string): string {
  const map: Record<string, string> = {
    APPROVED: "Approval recorded",
    REVOKED: "Approval revoked",
    COMMENTED: "Comment posted",
    COMMENT_DELETED: "Comment deleted",
    UPLOADED: "File uploaded",
    VERSION_UPLOADED: "New version uploaded",
    FILE_DELETED: "File deleted",
    MARKED_FINAL: "Marked as final",
    UNMARKED_FINAL: "Final mark removed",
    AI_DIFF_DONE: "AI change summary ready",
    AI_DIFF_ERROR: "AI change summary failed",
    STATUS_CHANGED: "Status changed",
    ADOPTION_STEP_CHECKED: "Step completed",
    ADOPTION_STEP_UNCHECKED: "Step unchecked",
    LOGGED_IN: "Signed in",
    LOGGED_OUT: "Signed out",
    OWNER_CHANGED: "Owner changed",
    TARGET_DATE_CHANGED: "Target date changed",
    DELIVERABLE_VIEWED: "Item viewed",
    EXPORTED: "Audit log exported",
  };
  return map[action] ?? action;
}
