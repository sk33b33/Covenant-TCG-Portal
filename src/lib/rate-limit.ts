import "server-only";

/**
 * A minimal in-memory fixed-window rate limiter for auth endpoints
 * (register, login, password reset requests).
 *
 * This is intentionally simple and has a known limitation: it is
 * per-process, so it resets on deploy/restart and does not share state
 * across multiple server instances. That's an acceptable trade-off for a
 * single-instance deployment, but before running this behind multiple
 * instances/replicas, replace it with a shared store (e.g. Redis/Upstash) —
 * the call sites in src/lib/auth-actions.ts are the only thing that would
 * need to change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded in a long-running
// process; runs at most once per check rather than on a timer.
function sweepExpired(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/**
 * @param key Unique identifier for the thing being limited, e.g. `login:${ip}:${email}`.
 * @param limit Max attempts allowed within the window.
 * @param windowSeconds Window length in seconds.
 */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
