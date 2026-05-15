import { headers } from "next/headers";

import { prisma } from "./db";

export type AuditAction =
  | "LOGGED_IN"
  | "LOGGED_OUT"
  | "APPROVED"
  | "REVOKED"
  | "COMMENTED"
  | "COMMENT_DELETED"
  | "UPLOADED"
  | "VERSION_UPLOADED"
  | "FILE_DELETED"
  | "MARKED_FINAL"
  | "UNMARKED_FINAL"
  | "AI_DIFF_DONE"
  | "AI_DIFF_ERROR"
  | "STATUS_CHANGED"
  | "OWNER_CHANGED"
  | "TARGET_DATE_CHANGED"
  | "EXPORTED"
  | "USER_UPDATED"
  | "DELIVERABLE_VIEWED"
  | "MEETING_CREATED"
  | "MEETING_UPDATED"
  | "REPORT_CREATED"
  | "REPORT_UPDATED"
  | "DECISION_CREATED"
  | "DECISION_UPDATED"
  | "SHARE_LINK_CREATED"
  | "SHARE_LINK_OPENED"
  | "BANK_STATEMENT_UPLOADED"
  | "BANK_STATEMENT_REVIEWED"
  | "BANK_STATEMENT_DELETED"
  | "ADOPTION_STEP_CHECKED"
  | "ADOPTION_STEP_UNCHECKED"
  | "REPORT_ACKNOWLEDGED"
  | "INFORMATION_REQUEST_CREATED"
  | "INFORMATION_REQUEST_ACKNOWLEDGED"
  | "INFORMATION_REQUEST_DELIVERED";

export type AuditEntry = {
  userId?: string | null;
  deliverableId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const h = await headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent") ?? null;

  await prisma.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      deliverableId: entry.deliverableId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata
        ? (entry.metadata as Parameters<typeof prisma.auditLog.create>[0]["data"]["metadata"])
        : undefined,
      ipAddress: ipAddress ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });
}
