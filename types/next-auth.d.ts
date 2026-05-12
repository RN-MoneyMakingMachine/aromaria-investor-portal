import type { Role, Side } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      title?: string;
      side: Side;
      role: Role;
      canApprove: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    title?: string;
    side?: Side;
    role?: Role;
    canApprove?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    title?: string;
    side: Side;
    role: Role;
    canApprove: boolean;
  }
}
