import { encode } from "@auth/core/jwt";
import type { BrowserContext } from "@playwright/test";

// In local dev, uses the secret from .env.local (loaded by playwright.config.ts).
// In CI, uses the test secret from .env.test.
const SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "";
const COOKIE_NAME = "authjs.session-token";

interface TestUser {
  id: string;
  githubId: string;
  nickname: string;
  email: string;
  role: "owner" | "contributor";
}

export const testOwner: TestUser = {
  id: "1",
  githubId: "12345",
  nickname: "octocat",
  email: "octocat@github.com",
  role: "owner",
};

export const testContributor: TestUser = {
  id: "2",
  githubId: "67890",
  nickname: "contributor-jane",
  email: "jane@example.com",
  role: "contributor",
};

export async function authenticateAs(
  context: BrowserContext,
  user: TestUser,
) {
  if (!SECRET) {
    throw new Error(
      "No AUTH_SECRET or NEXTAUTH_SECRET found in environment. " +
      "Ensure .env.local or .env.test is loaded.",
    );
  }

  const token = await encode({
    token: {
      sub: user.id,
      githubId: user.githubId,
      nickname: user.nickname,
      email: user.email,
      role: user.role,
      provider: user.role === "owner" ? "github-owner" : "github-contributor",
    },
    secret: SECRET,
    salt: COOKIE_NAME,
  });

  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
