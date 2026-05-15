"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Side, Status } from "@prisma/client";

import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toggleAdoptionStep } from "@/lib/services/adoption";
import { revokeApproval, toggleApproval } from "@/lib/services/approvals";
import { createComment, deleteComment } from "@/lib/services/comments";
import { changeStatus } from "@/lib/services/status";
import { mintShareToken, type ShareMode } from "@/lib/share-links";

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

export type CreateShareLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createShareLinkAction(
  fileId: string,
  mode: ShareMode = "view",
): Promise<CreateShareLinkResult> {
  const user = await requireUser();

  const file = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    select: { id: true, filename: true, deliverableId: true },
  });
  if (!file) return { ok: false, error: "File not found." };

  const token = mintShareToken(file.id, mode);

  const h = await headers();
  const host = h.get("host");
  if (!host) return { ok: false, error: "Cannot determine portal host." };
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const url = `${proto}://${host}/api/share/${token}`;

  await writeAudit({
    userId: user.id,
    deliverableId: file.deliverableId ?? undefined,
    action: "SHARE_LINK_CREATED",
    entityType: "FileUpload",
    entityId: file.id,
    metadata: { mode, filename: file.filename },
  });

  return { ok: true, url };
}

export async function toggleAdoptionStepAction(
  deliverableId: string,
  stepIndex: number,
): Promise<ActionResult> {
  const user = await requireUser();
  const result = await toggleAdoptionStep(user, deliverableId, stepIndex);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/deliverables/item/${result.deliverableId}`);
  return { ok: true };
}
