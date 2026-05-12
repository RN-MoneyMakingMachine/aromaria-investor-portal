import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createComment } from "@/lib/services/comments";
import type { SessionUser } from "@/lib/rbac";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { deliverableId?: string; body?: string; parentId?: string }
    | null;
  if (
    !body ||
    typeof body.deliverableId !== "string" ||
    typeof body.body !== "string"
  ) {
    return NextResponse.json(
      { error: "deliverableId and body are required" },
      { status: 400 },
    );
  }

  const result = await createComment(
    session.user as SessionUser,
    body.deliverableId,
    body.body,
    typeof body.parentId === "string" ? body.parentId : undefined,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
