import { NextResponse } from "next/server";
import type { Side } from "@prisma/client";

import { auth } from "@/lib/auth";
import {
  revokeApproval,
  toggleApproval,
} from "@/lib/services/approvals";
import type { SessionUser } from "@/lib/rbac";

const ALLOWED_SIDES: Side[] = ["NIKAIDO", "OMOY"];

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
    | { side?: string; revoke?: boolean }
    | null;
  if (!body || typeof body.side !== "string") {
    return NextResponse.json({ error: "Missing side" }, { status: 400 });
  }
  const side = body.side.toUpperCase() as Side;
  if (!ALLOWED_SIDES.includes(side)) {
    return NextResponse.json({ error: "Invalid side" }, { status: 400 });
  }

  const fn = body.revoke ? revokeApproval : toggleApproval;
  const result = await fn(session.user as SessionUser, id, side);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json(result);
}
