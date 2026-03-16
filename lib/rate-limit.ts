/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per key (typically user ID) with two windows:
 * - Burst: short window (e.g. 1 minute)
 * - Daily: 24-hour rolling cap
 *
 * Note: In-memory means limits reset on cold starts / new serverless instances.
 * This is acceptable — it catches sustained abuse without needing Redis.
 */

interface RateLimitEntry {
  /** Timestamps of requests in the burst window */
  burstHits: number[];
  /** Timestamps of requests in the daily window */
  dailyHits: number[];
}

interface RateLimitConfig {
  /** Max requests in the burst window */
  burstLimit: number;
  /** Burst window duration in ms (default: 60_000 = 1 minute) */
  burstWindowMs?: number;
  /** Max requests per day */
  dailyLimit: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const cleanupTimers = new Set<string>();

function ensureCleanup(namespace: string) {
  if (cleanupTimers.has(namespace)) return;
  cleanupTimers.add(namespace);

  setInterval(() => {
    const store = stores.get(namespace);
    if (!store) return;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    store.forEach((entry, key) => {
      // Remove entries with no recent activity
      entry.dailyHits = entry.dailyHits.filter((t) => now - t < dayMs);
      entry.burstHits = [];
      if (entry.dailyHits.length === 0) {
        store.delete(key);
      }
    });
  }, CLEANUP_INTERVAL);
}

/**
 * Extract a client IP from a request for IP-based rate limiting.
 * Falls back to "unknown" — still catches single-origin spam.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Creates a rate limiter for a specific namespace (e.g. "likes").
 *
 * Usage:
 * ```ts
 * const limiter = createRateLimiter("likes", { burstLimit: 30, dailyLimit: 500 });
 *
 * // In your route handler:
 * const result = limiter.check(userId);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.message }, { status: 429 });
 * }
 * ```
 */
export function createRateLimiter(namespace: string, config: RateLimitConfig) {
  const burstWindowMs = config.burstWindowMs ?? 60_000;

  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }
  ensureCleanup(namespace);

  return {
    check(key: string): { allowed: boolean; message?: string; dailyCount?: number } {
      const store = stores.get(namespace)!;
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      let entry = store.get(key);
      if (!entry) {
        entry = { burstHits: [], dailyHits: [] };
        store.set(key, entry);
      }

      // Clean expired timestamps
      entry.burstHits = entry.burstHits.filter((t) => now - t < burstWindowMs);
      entry.dailyHits = entry.dailyHits.filter((t) => now - t < dayMs);

      // Check daily limit first
      if (entry.dailyHits.length >= config.dailyLimit) {
        return {
          allowed: false,
          message: "Daily limit reached. Try again tomorrow.",
        };
      }

      // Check burst limit
      if (entry.burstHits.length >= config.burstLimit) {
        return {
          allowed: false,
          message: "Too many requests. Slow down.",
        };
      }

      // Record this request
      entry.burstHits.push(now);
      entry.dailyHits.push(now);

      return { allowed: true, dailyCount: entry.dailyHits.length };
    },
  };
}
