import { NextResponse } from "next/server";
import type { BankAccount } from "@prisma/client";

import { auth } from "@/lib/auth";
import { BANK_ACCOUNT_LABEL } from "@/lib/constants";
import type { SessionUser } from "@/lib/rbac";
import { uploadBankStatement } from "@/lib/services/bank-statements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ACCOUNTS = new Set<BankAccount>(
  Object.keys(BANK_ACCOUNT_LABEL) as BankAccount[],
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const rawAccount = req.headers.get("x-bank-account")?.trim() ?? "";
  if (!VALID_ACCOUNTS.has(rawAccount as BankAccount)) {
    return NextResponse.json(
      { error: "Missing or invalid x-bank-account header." },
      { status: 400 },
    );
  }

  const rawFilename = req.headers.get("x-filename") ?? "";
  let filename = "statement";
  try {
    filename = decodeURIComponent(rawFilename) || "statement";
  } catch {
    filename = rawFilename || "statement";
  }

  const result = await uploadBankStatement({
    user: session.user as SessionUser,
    account: rawAccount as BankAccount,
    filename,
    mimeType: req.headers.get("content-type") ?? "application/octet-stream",
    body: req.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result, { status: 201 });
}
