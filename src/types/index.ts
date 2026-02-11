// Shared TypeScript types for CLAHub

import "next-auth";
import "next-auth/jwt";

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      githubId: string;
      nickname: string;
      email?: string | null;
      avatarUrl?: string | null;
      role: string;
      accessToken?: string | null;
    };
  }

  interface User {
    githubId: string;
    nickname: string;
    avatarUrl?: string | null;
    role: string;
    accessToken?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubId: string;
    nickname: string;
    email?: string | null;
    avatarUrl?: string | null;
    role: string;
    accessToken?: string | null;
    provider: "github-owner" | "github-contributor";
  }
}
