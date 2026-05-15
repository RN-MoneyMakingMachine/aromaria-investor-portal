import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";
import { deleteBankStatement } from "@/lib/services/bank-statements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { id } = await params;
  const result = await deleteBankStatement(
    session.user as SessionUser,
    id,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
