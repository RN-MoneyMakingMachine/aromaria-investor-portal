import "server-only";

import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { SessionUser } from "@/lib/rbac";
import { canComment } from "@/lib/rbac";

export type CommentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createComment(
  user: SessionUser,
  deliverableId: string,
  body: string,
  parentId?: string,
): Promise<CommentResult> {
  if (!canComment(user)) {
    return { ok: false, error: "You must be signed in to comment." };
  }

  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "Comment cannot be empty." };
  }
  if (trimmed.length > 5000) {
    return { ok: false, error: "Comment must be 5000 characters or fewer." };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true },
  });
  if (!deliverable) return { ok: false, error: "Deliverable not found." };

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { deliverableId: true, parentId: true },
    });
    if (!parent || parent.deliverableId !== deliverableId) {
      return { ok: false, error: "Invalid parent comment." };
    }
    if (parent.parentId) {
      return { ok: false, error: "Replies are limited to one level." };
    }
  }

  const created = await prisma.comment.create({
    data: {
      deliverableId,
      userId: user.id,
      body: trimmed,
      parentId: parentId ?? null,
    },
  });

  await writeAudit({
    userId: user.id,
    deliverableId,
    action: "COMMENTED",
    entityType: "Comment",
    entityId: created.id,
    metadata: parentId ? { parentId } : undefined,
  });

  return { ok: true, id: created.id };
}

export type DeleteCommentResult =
  | { ok: true; deliverableId: string }
  | { ok: false; error: string };

export async function deleteComment(
  user: SessionUser,
  commentId: string,
): Promise<DeleteCommentResult> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      deliverableId: true,
      _count: { select: { replies: true } },
    },
  });

  if (!comment) return { ok: false, error: "Comment not found." };
  if (comment.userId !== user.id) {
    return { ok: false, error: "You can only delete your own comments." };
  }
  if (comment._count.replies > 0) {
    return {
      ok: false,
      error: "This comment has replies. Delete the replies first.",
    };
  }

  await prisma.comment.delete({ where: { id: comment.id } });

  await writeAudit({
    userId: user.id,
    deliverableId: comment.deliverableId,
    action: "COMMENT_DELETED",
    entityType: "Comment",
    entityId: comment.id,
  });

  return { ok: true, deliverableId: comment.deliverableId };
}
