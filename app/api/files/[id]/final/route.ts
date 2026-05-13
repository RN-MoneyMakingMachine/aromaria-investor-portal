import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";
import { setFinal } from "@/lib/services/files";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    isFinal?: unknown;
  } | null;
  const isFinal = body?.isFinal === true;

  const { id } = await params;
  const result = await setFinal(session.user as SessionUser, id, isFinal);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }
  return NextResponse.json({ ok: true, isFinal: result.isFinal });
}
