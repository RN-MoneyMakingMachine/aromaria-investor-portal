import { NextResponse } from "next/server";
import type { Status } from "@prisma/client";

import { auth } from "@/lib/auth";
import { changeStatus } from "@/lib/services/status";
import type { SessionUser } from "@/lib/rbac";

const ALLOWED: Status[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED_FOR_REVIEW",
  "IN_REVIEW",
  "BLOCKED",
  "COMPLETED",
];

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as
    | { status?: string }
    | null;
  if (!body || typeof body.status !== "string") {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }
  const status = body.status.toUpperCase() as Status;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await changeStatus(session.user as SessionUser, id, status);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result);
}
