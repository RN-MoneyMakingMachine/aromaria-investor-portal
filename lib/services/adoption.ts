import "server-only";

import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { isAdmin, type SessionUser } from "@/lib/rbac";

export type AdoptionStepView = {
  id: string;
  title: string;
  order: number;
  checkedAt: Date | null;
  checkedBy: { id: string; name: string } | null;
  createdAt: Date;
};

export async function listAdoptionSteps(
  deliverableId: string,
): Promise<AdoptionStepView[]> {
  const rows = await prisma.adoptionStep.findMany({
    where: { deliverableId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { checkedBy: { select: { id: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    order: r.order,
    checkedAt: r.checkedAt,
    checkedBy: r.checkedBy,
    createdAt: r.createdAt,
  }));
}

export type AdoptionResult =
  | { ok: true; deliverableId: string }
  | { ok: false; error: string; status: number };

function denyIfNotAdmin(user: SessionUser): AdoptionResult | null {
  if (!isAdmin(user)) {
    return {
      ok: false,
      error: "Only admins can change the adoption checklist.",
      status: 403,
    };
  }
  return null;
}

export async function createAdoptionStep(
  user: SessionUser,
  deliverableId: string,
  title: string,
): Promise<AdoptionResult> {
  const deny = denyIfNotAdmin(user);
  if (deny) return deny;
  const cleaned = title.trim();
  if (!cleaned) {
    return { ok: false, error: "Step title is required.", status: 400 };
  }
  if (cleaned.length > 500) {
    return { ok: false, error: "Step title is too long.", status: 400 };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true },
  });
  if (!deliverable) {
    return { ok: false, error: "Deliverable not found.", status: 404 };
  }

  // Append to the end. Order = max(existing) + 1.
  const last = await prisma.adoptionStep.findFirst({
    where: { deliverableId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (last?.order ?? -1) + 1;

  const created = await prisma.adoptionStep.create({
    data: {
      deliverableId,
      title: cleaned,
      order: nextOrder,
    },
  });

  await writeAudit({
    userId: user.id,
    deliverableId,
    action: "ADOPTION_STEP_CREATED",
    entityType: "AdoptionStep",
    entityId: created.id,
    metadata: { title: cleaned },
  });

  return { ok: true, deliverableId };
}

export async function updateAdoptionStep(
  user: SessionUser,
  stepId: string,
  title: string,
): Promise<AdoptionResult> {
  const deny = denyIfNotAdmin(user);
  if (deny) return deny;
  const cleaned = title.trim();
  if (!cleaned) {
    return { ok: false, error: "Step title is required.", status: 400 };
  }
  if (cleaned.length > 500) {
    return { ok: false, error: "Step title is too long.", status: 400 };
  }

  const existing = await prisma.adoptionStep.findUnique({
    where: { id: stepId },
    select: { id: true, deliverableId: true, title: true },
  });
  if (!existing) {
    return { ok: false, error: "Step not found.", status: 404 };
  }
  if (existing.title === cleaned) {
    return { ok: true, deliverableId: existing.deliverableId };
  }

  await prisma.adoptionStep.update({
    where: { id: stepId },
    data: { title: cleaned },
  });

  await writeAudit({
    userId: user.id,
    deliverableId: existing.deliverableId,
    action: "ADOPTION_STEP_UPDATED",
    entityType: "AdoptionStep",
    entityId: stepId,
    metadata: { from: existing.title, to: cleaned },
  });

  return { ok: true, deliverableId: existing.deliverableId };
}

export async function toggleAdoptionStep(
  user: SessionUser,
  stepId: string,
): Promise<AdoptionResult> {
  const deny = denyIfNotAdmin(user);
  if (deny) return deny;

  const existing = await prisma.adoptionStep.findUnique({
    where: { id: stepId },
    select: { id: true, deliverableId: true, checkedAt: true },
  });
  if (!existing) {
    return { ok: false, error: "Step not found.", status: 404 };
  }

  const willBeChecked = !existing.checkedAt;

  await prisma.adoptionStep.update({
    where: { id: stepId },
    data: willBeChecked
      ? { checkedAt: new Date(), checkedById: user.id }
      : { checkedAt: null, checkedById: null },
  });

  await writeAudit({
    userId: user.id,
    deliverableId: existing.deliverableId,
    action: willBeChecked ? "ADOPTION_STEP_CHECKED" : "ADOPTION_STEP_UNCHECKED",
    entityType: "AdoptionStep",
    entityId: stepId,
  });

  return { ok: true, deliverableId: existing.deliverableId };
}

export async function deleteAdoptionStep(
  user: SessionUser,
  stepId: string,
): Promise<AdoptionResult> {
  const deny = denyIfNotAdmin(user);
  if (deny) return deny;

  const existing = await prisma.adoptionStep.findUnique({
    where: { id: stepId },
    select: { id: true, deliverableId: true, title: true },
  });
  if (!existing) {
    return { ok: false, error: "Step not found.", status: 404 };
  }

  await prisma.adoptionStep.delete({ where: { id: stepId } });

  await writeAudit({
    userId: user.id,
    deliverableId: existing.deliverableId,
    action: "ADOPTION_STEP_DELETED",
    entityType: "AdoptionStep",
    entityId: stepId,
    metadata: { title: existing.title },
  });

  return { ok: true, deliverableId: existing.deliverableId };
}

export type BulkImportResult =
  | {
      ok: true;
      deliverableId: string;
      deliverableName: string;
      created: number;
      skipped: number;
    }
  | { ok: false; error: string; status: number };

export type BulkCaller =
  | { kind: "user"; user: SessionUser }
  | { kind: "system"; source: string };

export async function bulkCreateAdoptionSteps(
  caller: BulkCaller,
  deliverableId: string,
  titles: string[],
): Promise<BulkImportResult> {
  if (caller.kind === "user" && !isAdmin(caller.user)) {
    return {
      ok: false,
      error: "Only admins can change the adoption checklist.",
      status: 403,
    };
  }

  const cleaned = titles
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !t.startsWith("#"));

  if (cleaned.length === 0) {
    return { ok: false, error: "No steps to import.", status: 400 };
  }
  if (cleaned.length > 200) {
    return {
      ok: false,
      error: "Too many steps in one request (max 200).",
      status: 400,
    };
  }
  const tooLong = cleaned.find((t) => t.length > 500);
  if (tooLong) {
    return {
      ok: false,
      error: `Step title too long (>500 chars): "${tooLong.slice(0, 60)}…"`,
      status: 400,
    };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, name: true },
  });
  if (!deliverable) {
    return { ok: false, error: "Deliverable not found.", status: 404 };
  }

  const existing = await prisma.adoptionStep.findMany({
    where: { deliverableId },
    select: { title: true, order: true },
    orderBy: { order: "desc" },
  });
  const existingKeys = new Set(existing.map((s) => s.title.trim().toLowerCase()));
  let nextOrder = existing.length > 0 ? existing[0].order + 1 : 0;

  const toCreate: { title: string; order: number }[] = [];
  for (const title of cleaned) {
    const key = title.toLowerCase();
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    toCreate.push({ title, order: nextOrder });
    nextOrder += 1;
  }

  const auditUserId = caller.kind === "user" ? caller.user.id : null;
  const sourceMeta =
    caller.kind === "system" ? { source: caller.source } : undefined;

  let created = 0;
  for (const row of toCreate) {
    const inserted = await prisma.adoptionStep.create({
      data: {
        deliverableId,
        title: row.title,
        order: row.order,
      },
    });
    created += 1;
    await writeAudit({
      userId: auditUserId,
      deliverableId,
      action: "ADOPTION_STEP_CREATED",
      entityType: "AdoptionStep",
      entityId: inserted.id,
      metadata: { title: row.title, bulk: true, ...sourceMeta },
    });
  }

  return {
    ok: true,
    deliverableId,
    deliverableName: deliverable.name,
    created,
    skipped: cleaned.length - created,
  };
}
