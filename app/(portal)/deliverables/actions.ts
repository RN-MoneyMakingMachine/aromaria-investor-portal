"use server";

import { revalidatePath } from "next/cache";
import type { Side, Status } from "@prisma/client";

import { requireUser } from "@/lib/session";
import { revokeApproval, toggleApproval } from "@/lib/services/approvals";
import { createComment, deleteComment } from "@/lib/services/comments";
import { changeStatus } from "@/lib/services/status";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function approveAction(
  deliverableId: string,
  side: Side,
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toggleApproval(user, deliverableId, side);
  if (!result.ok) return result;
  revalidatePath(`/deliverables/item/${deliverableId}`);
  revalidatePath("/deliverables");
  return { ok: true };
}

export async function revokeApprovalAction(
  deliverableId: string,
  side: Side,
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await revokeApproval(user, deliverableId, side);
  if (!result.ok) return result;
  revalidatePath(`/deliverables/item/${deliverableId}`);
  revalidatePath("/deliverables");
  return { ok: true };
}

export async function changeStatusAction(
  deliverableId: string,
  toStatus: Status,
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await changeStatus(user, deliverableId, toStatus);
  if (!result.ok) return result;
  revalidatePath(`/deliverables/item/${deliverableId}`);
  revalidatePath("/deliverables");
  return { ok: true };
}

export type CommentState = { error?: string; body?: string };

export async function postCommentAction(
  deliverableId: string,
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "");
  const parentId = formData.get("parentId");
  const parentIdStr =
    typeof parentId === "string" && parentId.length > 0 ? parentId : undefined;

  const result = await createComment(user, deliverableId, body, parentIdStr);
  if (!result.ok) {
    return { error: result.error, body };
  }
  revalidatePath(`/deliverables/item/${deliverableId}`);
  return {};
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await deleteComment(user, commentId);
  if (!result.ok) return result;
  revalidatePath(`/deliverables/item/${result.deliverableId}`);
  return { ok: true };
}
