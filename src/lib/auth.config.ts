import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import "@/types";

export const authConfig = {
  providers: [
    GitHub({
      id: "github-owner",
      name: "GitHub (Owner)",
      clientId: process.env.GITHUB_OWNER_CLIENT_ID,
      clientSecret: process.env.GITHUB_OWNER_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user:email repo:status admin:repo_hook read:org",
        },
      },
    }),
    GitHub({
      id: "github-contributor",
      name: "GitHub (Contributor)",
      clientId: process.env.GITHUB_CONTRIBUTOR_CLIENT_ID,
      clientSecret: process.env.GITHUB_CONTRIBUTOR_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    session({ session, token }) {
      session.user = {
        id: token.sub!,
        githubId: token.githubId,
        nickname: token.nickname,
        email: token.email ?? null,
        avatarUrl: token.avatarUrl ?? null,
        role: token.role,
        accessToken:
          token.role === "owner" ? (token.accessToken ?? null) : null,
      } as typeof session.user;
      return session;
    },
  },
} satisfies NextAuthConfig;
