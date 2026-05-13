"use server";

import { signOut, auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function doSignOut() {
  const session = await auth();
  if (session?.user?.id) {
    await writeAudit({
      userId: session.user.id,
      action: "LOGGED_OUT",
      entityType: "User",
      entityId: session.user.id,
    });
  }
  await signOut({ redirectTo: "/login" });
}
