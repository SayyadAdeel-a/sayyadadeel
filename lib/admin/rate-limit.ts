/**
 * Login rate limiting.
 *
 * Deliberately in-memory. There is no database in this project by design, and
 * adding one just to count attempts would defeat that. The trade-off is honest
 * and worth stating: a serverless isolate is per-instance, so a distributed
 * flood gets a fresh budget per instance, and a cold start resets the counters.
 *
 * That still stops the attack this is aimed at — someone guessing the password
 * from a script on one machine. It is not a defence against a determined
 * distributed attacker; for that you would put Cloudflare rate limiting or a WAF
 * rule in front of `/api/admin/login`, which is the right place for it anyway.
 */

/** Five failures in fifteen minutes locks an origin out. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
/** ...and the lockout itself expires after fifteen minutes. */
const LOCKOUT_MS = 15 * 60 * 1000;

interface Bucket {
  failures: number[];
  lockedUntil: number;
}

const buckets = new Map<string, Bucket>();

// Serverless isolates are recycled; without this the map would grow with every
// distinct IP for the life of the instance.
const MAX_TRACKED_KEYS = 5000;

/** Best-effort client identity, preferring the proxy's forwarded address. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Seconds the caller must wait, or 0 if they may attempt a login now. */
export function retryAfterSeconds(key: string): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  if (Date.now() < bucket.lockedUntil) {
    return Math.ceil((bucket.lockedUntil - Date.now()) / 1000);
  }
  return 0;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { failures: [], lockedUntil: 0 };

  bucket.failures = bucket.failures.filter((at) => now - at < WINDOW_MS);
  bucket.failures.push(now);

  if (bucket.failures.length >= MAX_FAILURES) {
    bucket.lockedUntil = now + LOCKOUT_MS;
  }

  if (buckets.size > MAX_TRACKED_KEYS) {
    // Evict the least recently touched bucket rather than growing unbounded.
    const oldest = [...buckets.entries()].sort(
      (a, b) => a[1].lockedUntil - b[1].lockedUntil
    )[0];
    if (oldest) buckets.delete(oldest[0]);
  }

  buckets.set(key, bucket);
}

/** Clear the record for a key after a successful login. */
export function recordSuccess(key: string): void {
  buckets.delete(key);
}

/** Exposed for tests and for the admin status panel. */
export const limits = { WINDOW_MS, MAX_FAILURES, LOCKOUT_MS };