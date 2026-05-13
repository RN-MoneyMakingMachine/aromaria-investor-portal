import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getFinalForDeliverable } from "@/lib/services/files";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const final = await getFinalForDeliverable(id);
  if (!final) {
    return NextResponse.json(
      { error: "No final document on this deliverable yet." },
      { status: 404 },
    );
  }
  return NextResponse.redirect(new URL(`/api/files/${final.id}`, _req.url), 302);
}
