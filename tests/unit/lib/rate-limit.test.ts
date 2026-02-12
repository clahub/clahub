import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RateLimiter } from "@/lib/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  afterEach(() => {
    limiter.destroy();
  });

  it("allows requests under the limit", () => {
    const result = limiter.check("test-key", 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
  });

  it("decrements remaining on each call", () => {
    limiter.check("key", 3);
    const second = limiter.check("key", 3);
    expect(second.remaining).toBe(1);

    const third = limiter.check("key", 3);
    expect(third.remaining).toBe(0);
    expect(third.allowed).toBe(true);
  });

  it("blocks requests when limit is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      limiter.check("key", 3);
    }
    const result = limiter.check("key", 3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 5; i++) {
      limiter.check("key-a", 5);
    }
    // key-a is exhausted
    expect(limiter.check("key-a", 5).allowed).toBe(false);
    // key-b is fresh
    expect(limiter.check("key-b", 5).allowed).toBe(true);
    expect(limiter.check("key-b", 5).remaining).toBe(3);
  });

  it("resets after window expires", () => {
    vi.useFakeTimers();
    try {
      limiter.check("key", 2);
      limiter.check("key", 2);
      expect(limiter.check("key", 2).allowed).toBe(false);

      // Advance past the 60-second window
      vi.advanceTimersByTime(61_000);

      const result = limiter.check("key", 2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns resetAt as a future epoch timestamp", () => {
    const result = limiter.check("key", 10);
    const now = Math.floor(Date.now() / 1000);
    expect(result.resetAt).toBeGreaterThan(now);
    expect(result.resetAt).toBeLessThanOrEqual(now + 60);
  });

  it("cleans up expired entries", () => {
    vi.useFakeTimers();
    try {
      limiter.check("key-1", 10);
      limiter.check("key-2", 10);
      expect(limiter.size).toBe(2);

      vi.advanceTimersByTime(61_000);
      limiter.cleanup();

      expect(limiter.size).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps non-expired entries during cleanup", () => {
    vi.useFakeTimers();
    try {
      limiter.check("old-key", 10);
      vi.advanceTimersByTime(50_000);
      limiter.check("new-key", 10);

      vi.advanceTimersByTime(11_000); // old-key expired, new-key still valid
      limiter.cleanup();

      expect(limiter.size).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
