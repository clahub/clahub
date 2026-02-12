import { NextResponse, type NextRequest } from "next/server";
import { type ApiUser } from "@/lib/api-auth";
import { apiError, ErrorCode } from "@/lib/api-error";
import { RateLimiter } from "@/lib/rate-limit";
import { hashApiKey } from "@/lib/api-keys";

const limiter = new RateLimiter();

const LIMITS = {
  api_key: 100,
  session: 60,
  anonymous: 30,
} as const;

function getKey(request: NextRequest, user: ApiUser | null): string {
  if (user?.authMethod === "api_key") {
    // Key by the bearer token hash so each API key has its own bucket
    const token = request.headers.get("authorization")?.slice(7) ?? "";
    return `api_key:${hashApiKey(token)}`;
  }
  if (user?.authMethod === "session") {
    return `session:${user.id}`;
  }
  // Unauthenticated — key by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  return `ip:${ip}`;
}

function getLimit(user: ApiUser | null): number {
  if (user?.authMethod === "api_key") return LIMITS.api_key;
  if (user?.authMethod === "session") return LIMITS.session;
  return LIMITS.anonymous;
}

function rateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(resetAt),
  };
}

/**
 * Apply rate limiting to a request.
 * Returns a 429 NextResponse if the limit is exceeded, or null if allowed.
 * Callers should attach the returned headers to their success response.
 *
 * Usage:
 *   const rl = applyRateLimit(request, user);
 *   if (rl.response) return rl.response;
 *   // ... build your response, then:
 *   return NextResponse.json(data, { headers: rl.headers });
 */
export function applyRateLimit(
  request: NextRequest,
  user: ApiUser | null,
): { response: NextResponse | null; headers: Record<string, string> } {
  const key = getKey(request, user);
  const limit = getLimit(user);
  const result = limiter.check(key, limit);
  const headers = rateLimitHeaders(result.limit, result.remaining, result.resetAt);

  if (!result.allowed) {
    const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1000));
    const response = apiError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      "Too many requests",
      429,
    );
    // Add rate limit + retry-after headers to the error response
    for (const [k, v] of Object.entries(headers)) {
      response.headers.set(k, v);
    }
    response.headers.set("Retry-After", String(retryAfter));
    return { response, headers };
  }

  return { response: null, headers };
}

/** Exposed for testing. */
export { limiter as _limiter };
