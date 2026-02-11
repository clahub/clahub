import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";

async function fetchVerifiedEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;
  const emails: { email: string; primary: boolean; verified: boolean }[] =
    await res.json();
  const primary = emails.find((e) => e.primary && e.verified);
  return primary?.email ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const githubId = String(profile.id);
        const nickname = (profile.login as string) ?? "";
        const avatarUrl = (profile.avatar_url as string) ?? null;
        const isOwner = account.provider === "github-owner";
        const accessToken = account.access_token ?? null;

        const email = accessToken
          ? await fetchVerifiedEmail(accessToken)
          : null;

        const existing = await prisma.user.findUnique({
          where: { githubId },
        });

        const user = await prisma.user.upsert({
          where: { githubId },
          create: {
            githubId,
            nickname,
            email,
            avatarUrl,
            oauthToken: isOwner ? accessToken : null,
            role: isOwner ? "owner" : "contributor",
          },
          update: {
            nickname,
            email: email ?? existing?.email,
            avatarUrl,
            ...(isOwner && { oauthToken: accessToken }),
            ...(isOwner &&
              existing?.role !== "owner" && { role: "owner" }),
          },
        });

        token.githubId = githubId;
        token.nickname = nickname;
        token.email = user.email;
        token.avatarUrl = user.avatarUrl;
        token.role = user.role;
        token.accessToken = isOwner ? accessToken : null;
        token.provider = account.provider as
          | "github-owner"
          | "github-contributor";
        token.sub = String(user.id);
      }
      return token;
    },
  },
});
