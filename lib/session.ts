import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/rbac";

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user as SessionUser;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as SessionUser;
}

export function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}
