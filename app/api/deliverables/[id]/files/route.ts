import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";
import { uploadDeliverableFile } from "@/lib/services/files";

export const runtime = "nodejs";
// Don't try to buffer the request body; we stream it straight to disk.
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: deliverableId } = await params;

  const rawHeader = req.headers.get("x-filename") ?? "";
  let filename = "file";
  try {
    filename = decodeURIComponent(rawHeader) || "file";
  } catch {
    filename = rawHeader || "file";
  }

  const result = await uploadDeliverableFile({
    user: session.user as SessionUser,
    deliverableId,
    filename,
    mimeType: req.headers.get("content-type") ?? "application/octet-stream",
    body: req.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json(result, { status: 201 });
}
