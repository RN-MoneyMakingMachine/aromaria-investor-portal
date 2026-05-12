import "server-only";

import type { Status } from "@prisma/client";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";
import { canEdit } from "@/lib/rbac";

export type StatusResult =
  | { ok: true; status: Status }
  | { ok: false; error: string };

const DEFAULT_PROGRESS: Record<Status, number> = {
  NOT_STARTED: 0,
  IN_PROGRESS: 50,
  BLOCKED: 25,
  COMPLETED: 100,
};

export async function changeStatus(
  user: SessionUser,
  deliverableId: string,
  toStatus: Status,
): Promise<StatusResult> {
  if (!canEdit(user)) {
    return { ok: false, error: "You are not authorised to change status." };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: { approvals: true },
  });
  if (!deliverable) return { ok: false, error: "Deliverable not found." };

  if (deliverable.status === toStatus) {
    return { ok: true, status: toStatus };
  }

  if (toStatus === "COMPLETED") {
    const hasNikaido = deliverable.approvals.some((a) => a.side === "NIKAIDO");
    const hasOmoy = deliverable.approvals.some((a) => a.side === "OMOY");
    if (!hasNikaido || !hasOmoy) {
      return {
        ok: false,
        error:
          "Both side approvals are required to mark this completed. Approvals flip status automatically.",
      };
    }
  }

  const previous = deliverable.status;

  await prisma.$transaction(async (tx) => {
    await tx.deliverable.update({
      where: { id: deliverableId },
      data: {
        status: toStatus,
        progressPercent: DEFAULT_PROGRESS[toStatus],
      },
    });
    await tx.statusChange.create({
      data: {
        deliverableId,
        userId: user.id,
        fromStatus: previous,
        toStatus,
      },
    });
  });

  await writeAudit({
    userId: user.id,
    deliverableId,
    action: "STATUS_CHANGED",
    entityType: "Deliverable",
    entityId: deliverableId,
    metadata: { from: previous, to: toStatus },
  });

  return { ok: true, status: toStatus };
}
