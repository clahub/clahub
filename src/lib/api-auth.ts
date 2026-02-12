import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-keys";

export interface ApiUser {
  id: number;
  githubId: string;
  nickname: string;
  email: string | null;
  role: string;
  authMethod: "api_key" | "session";
}

export async function authenticateRequest(
  request: NextRequest,
): Promise<ApiUser | null> {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7);

    // Only accept clahub_ prefixed tokens as API keys
    if (!token.startsWith("clahub_")) {
      return null;
    }

    const keyHash = hashApiKey(token);
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKey || apiKey.revokedAt) {
      return null;
    }

    // Fire-and-forget lastUsedAt update
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return {
      id: apiKey.user.id,
      githubId: apiKey.user.githubId,
      nickname: apiKey.user.nickname,
      email: apiKey.user.email,
      role: apiKey.user.role,
      authMethod: "api_key",
    };
  }

  // Fall back to session auth
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  return {
    id: parseInt(session.user.id, 10),
    githubId: session.user.githubId,
    nickname: session.user.nickname,
    email: session.user.email ?? null,
    role: session.user.role,
    authMethod: "session",
  };
}
