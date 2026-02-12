export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // UTC epoch seconds
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const CLEANUP_INTERVAL = 60_000; // 1 minute

export class RateLimiter {
  private windows = new Map<string, WindowEntry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
    // Allow Node to exit without waiting for this timer
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Check and consume one request for the given key.
   * @param key   Unique identifier (e.g. "api_key:<hash>", "ip:<addr>")
   * @param limit Max requests per 60-second window
   */
  check(key: string, limit: number): RateLimitResult {
    const now = Math.floor(Date.now() / 1000);
    let entry = this.windows.get(key);

    // Start a new window if none exists or the current one expired
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + 60 };
      this.windows.set(key, entry);
    }

    entry.count++;

    if (entry.count > limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    return {
      allowed: true,
      limit,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /** Remove expired entries to prevent memory leaks. */
  cleanup(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) {
        this.windows.delete(key);
      }
    }
  }

  /** Stop the cleanup timer (for tests). */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Visible for testing. */
  get size(): number {
    return this.windows.size;
  }
}
