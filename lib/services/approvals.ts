import "server-only";

import type { Side } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";
import { canApproveSide, isAdmin } from "@/lib/rbac";
import { STATUS_PROGRESS } from "@/lib/constants";

export type ApprovalResult =
  | { ok: true; approved: boolean }
  | { ok: false; error: string };

export async function toggleApproval(
  user: SessionUser,
  deliverableId: string,
  side: Side,
): Promise<ApprovalResult> {
  if (!canApproveSide(user, side) && !isAdmin(user)) {
    return { ok: false, error: "You are not authorised to approve this side." };
  }
  if (isAdmin(user) && !canApproveSide(user, side)) {
    return {
      ok: false,
      error: "Admin override on approval is reserved for revocations only.",
    };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { approvals: true },
  });
  if (!deliverable) return { ok: false, error: "Deliverable not found." };

  const existing = deliverable.approvals.find((a) => a.side === side);

  if (existing) {
    return {
      ok: false,
      error:
        "This side has already been approved. Use revoke to reverse the decision.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.approval.create({
      data: {
        deliverableId,
        userId: user.id,
        side,
      },
    });

    const fresh = await tx.deliverable.findUnique({
      where: { id: deliverableId },
      include: { approvals: true },
    });
    if (!fresh) return;

    const hasNikaido = fresh.approvals.some((a) => a.side === "NIKAIDO");
    const hasOmoy = fresh.approvals.some((a) => a.side === "OMOY");

    if (hasNikaido && hasOmoy && fresh.status !== "COMPLETED") {
      const previous = fresh.status;
      await tx.deliverable.update({
        where: { id: deliverableId },
        data: { status: "COMPLETED", progressPercent: 100 },
      });
      await tx.statusChange.create({
        data: {
          deliverableId,
          userId: user.id,
          fromStatus: previous,
          toStatus: "COMPLETED",
        },
      });
    }
  });

  await writeAudit({
    userId: user.id,
    deliverableId,
    action: "APPROVED",
    entityType: "Approval",
    entityId: deliverableId,
    metadata: { side },
  });

  return { ok: true, approved: true };
}

export async function revokeApproval(
  user: SessionUser,
  deliverableId: string,
  side: Side,
): Promise<ApprovalResult> {
  if (!isAdmin(user)) {
    return { ok: false, error: "Only admins can revoke approvals." };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { approvals: true },
  });
  if (!deliverable) return { ok: false, error: "Deliverable not found." };

  const existing = deliverable.approvals.find((a) => a.side === side);
  if (!existing) {
    return { ok: false, error: "No approval exists on that side." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.approval.delete({ where: { id: existing.id } });

    if (deliverable.status === "COMPLETED") {
      await tx.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: "IN_REVIEW",
          progressPercent: STATUS_PROGRESS.IN_REVIEW,
        },
      });
      await tx.statusChange.create({
        data: {
          deliverableId,
          userId: user.id,
          fromStatus: "COMPLETED",
          toStatus: "IN_REVIEW",
        },
      });
    }
  });

  await writeAudit({
    userId: user.id,
    deliverableId,
    action: "REVOKED",
    entityType: "Approval",
    entityId: deliverableId,
    metadata: { side },
  });

  return { ok: true, approved: false };
}
