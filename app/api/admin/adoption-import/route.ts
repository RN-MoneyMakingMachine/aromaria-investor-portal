import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin, type SessionUser } from "@/lib/rbac";
import {
  bulkCreateAdoptionSteps,
  type BulkCaller,
} from "@/lib/services/adoption";

type Body = {
  deliverableCode?: unknown;
  deliverableId?: unknown;
  steps?: unknown;
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

async function resolveCaller(req: Request): Promise<
  | { ok: true; caller: BulkCaller }
  | { ok: false; status: number; error: string }
> {
  const session = await auth();
  if (session?.user?.id && isAdmin(session.user as SessionUser)) {
    return { ok: true, caller: { kind: "user", user: session.user as SessionUser } };
  }

  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const expected = process.env.ADOPTION_IMPORT_TOKEN;
  if (match && expected && timingSafeEqual(match[1], expected)) {
    return { ok: true, caller: { kind: "system", source: "adoption-import-token" } };
  }

  return { ok: false, status: 401, error: "Unauthorised" };
}

export async function POST(req: Request) {
  const authResult = await resolveCaller(req);
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) {
    return NextResponse.json(
      { error: "Body must be JSON." },
      { status: 400 },
    );
  }
  if (!Array.isArray(body.steps)) {
    return NextResponse.json(
      { error: "steps must be an array of strings." },
      { status: 400 },
    );
  }
  const stepStrings = body.steps.filter(
    (s): s is string => typeof s === "string",
  );

  let deliverableId: string | null = null;
  if (typeof body.deliverableId === "string" && body.deliverableId.length > 0) {
    deliverableId = body.deliverableId;
  } else if (
    typeof body.deliverableCode === "string" &&
    body.deliverableCode.length > 0
  ) {
    const found = await prisma.deliverable.findUnique({
      where: { code: body.deliverableCode },
      select: { id: true },
    });
    if (!found) {
      return NextResponse.json(
        { error: `No deliverable with code "${body.deliverableCode}".` },
        { status: 404 },
      );
    }
    deliverableId = found.id;
  } else {
    return NextResponse.json(
      { error: "Provide deliverableCode or deliverableId." },
      { status: 400 },
    );
  }

  const result = await bulkCreateAdoptionSteps(
    authResult.caller,
    deliverableId,
    stepStrings,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    created: result.created,
    skipped: result.skipped,
    deliverableId: result.deliverableId,
    deliverableName: result.deliverableName,
  });
}
