import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const raw = credentials?.email;
        if (typeof raw !== "string") return null;
        const email = raw.trim().toLowerCase();
        if (!email) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          title: user.title ?? undefined,
          side: user.side,
          role: user.role,
          canApprove: user.canApprove,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.name = user.name as string;
        token.title = (user as { title?: string }).title;
        token.side = (user as { side: string }).side;
        token.role = (user as { role: string }).role;
        token.canApprove = (user as { canApprove: boolean }).canApprove;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.title = token.title as string | undefined;
        session.user.side = token.side as never;
        session.user.role = token.role as never;
        session.user.canApprove = token.canApprove as boolean;
      }
      return session;
    },
  },
});
