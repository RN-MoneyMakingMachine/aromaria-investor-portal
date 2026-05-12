"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export type LoginState = {
  error?: string;
  email?: string;
};

export async function authenticate(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!rawEmail) {
    return { error: "Enter your email address.", email: "" };
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: rawEmail, mode: "insensitive" } },
    select: { id: true },
  });

  if (!user) {
    return {
      error: "This email is not registered for the portal.",
      email: rawEmail,
    };
  }

  await writeAudit({
    userId: user.id,
    action: "LOGGED_IN",
    entityType: "User",
    entityId: user.id,
  });

  try {
    await signIn("credentials", {
      email: rawEmail,
      redirectTo: "/welcome",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Sign in failed. Please try again.",
        email: rawEmail,
      };
    }
    throw error;
  }

  return {};
}
