import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { applyRateLimit, _limiter } from "@/lib/api-rate-limit";
import type { ApiUser } from "@/lib/api-auth";

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/test", { headers });
}

function makeUser(overrides: Partial<ApiUser> = {}): ApiUser {
  return {
    id: 1,
    githubId: "12345",
    nickname: "testuser",
    email: "test@example.com",
    role: "owner",
    authMethod: "session",
    ...overrides,
  };
}

describe("applyRateLimit", () => {
  beforeEach(() => {
    // Reset limiter state between tests
    _limiter.cleanup();
    // Force-clear all entries by destroying and noting the module singleton
    // is shared, so we clean by advancing past windows
  });

  it("allows requests and returns rate limit headers", () => {
    const request = makeRequest({ "x-forwarded-for": "1.2.3.4" });
    const { response, headers } = applyRateLimit(request, null);

    expect(response).toBeNull();
    expect(headers["X-RateLimit-Limit"]).toBe("30");
    expect(Number(headers["X-RateLimit-Remaining"])).toBe(29);
    expect(headers["X-RateLimit-Reset"]).toBeDefined();
  });

  it("uses 100/min limit for API key auth", () => {
    const request = makeRequest({
      authorization: "Bearer clahub_test123",
    });
    const user = makeUser({ authMethod: "api_key" });
    const { response, headers } = applyRateLimit(request, user);

    expect(response).toBeNull();
    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("99");
  });

  it("uses 60/min limit for session auth", () => {
    const request = makeRequest();
    const user = makeUser({ authMethod: "session", id: 999 });
    const { response, headers } = applyRateLimit(request, user);

    expect(response).toBeNull();
    expect(headers["X-RateLimit-Limit"]).toBe("60");
    expect(headers["X-RateLimit-Remaining"]).toBe("59");
  });

  it("uses 30/min limit for unauthenticated requests", () => {
    const request = makeRequest({ "x-forwarded-for": "10.0.0.1" });
    const { response, headers } = applyRateLimit(request, null);

    expect(response).toBeNull();
    expect(headers["X-RateLimit-Limit"]).toBe("30");
  });

  it("returns 429 when limit is exceeded", async () => {
    const ip = "192.168.1.100";
    let result;
    for (let i = 0; i < 31; i++) {
      result = applyRateLimit(
        makeRequest({ "x-forwarded-for": ip }),
        null,
      );
    }

    expect(result!.response).not.toBeNull();
    expect(result!.response!.status).toBe(429);

    const body = await result!.response!.json();
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(body.error.message).toBe("Too many requests");
  });

  it("includes Retry-After header on 429", () => {
    const ip = "10.20.30.40";
    let result;
    for (let i = 0; i < 31; i++) {
      result = applyRateLimit(
        makeRequest({ "x-forwarded-for": ip }),
        null,
      );
    }

    expect(result!.response!.headers.get("Retry-After")).toBeDefined();
    const retryAfter = Number(result!.response!.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("includes rate limit headers on 429 response", () => {
    const ip = "10.20.30.41";
    let result;
    for (let i = 0; i < 31; i++) {
      result = applyRateLimit(
        makeRequest({ "x-forwarded-for": ip }),
        null,
      );
    }

    expect(result!.response!.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(result!.response!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(result!.response!.headers.get("X-RateLimit-Reset")).toBeDefined();
  });

  it("falls back to 127.0.0.1 when no IP headers present", () => {
    const request = makeRequest();
    const { response, headers } = applyRateLimit(request, null);

    expect(response).toBeNull();
    expect(headers["X-RateLimit-Limit"]).toBe("30");
  });

  it("keys API key requests by token hash, not user ID", () => {
    const user = makeUser({ authMethod: "api_key", id: 1 });

    // Two different API keys for the same user get separate buckets
    const r1 = applyRateLimit(
      makeRequest({ authorization: "Bearer clahub_key_aaa" }),
      user,
    );
    const r2 = applyRateLimit(
      makeRequest({ authorization: "Bearer clahub_key_bbb" }),
      user,
    );

    // Both should have 99 remaining (separate buckets, first request each)
    expect(r1.headers["X-RateLimit-Remaining"]).toBe("99");
    expect(r2.headers["X-RateLimit-Remaining"]).toBe("99");
  });
});
