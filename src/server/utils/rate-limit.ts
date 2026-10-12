/**
 * Lightweight in-memory rate limiter for server endpoints.
 * Guards against brute-force answer enumeration and attempt spamming.
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets: Map<string, RateBucket> = new Map();

/**
 * Checks if the identifier has exceeded the rate limit.
 * Returns true if allowed, false if rate limited.
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    bucket = {
      count: 1,
      resetAt: now + windowMs,
    };
    buckets.set(identifier, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Clears expired rate buckets to avoid memory growth.
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}
