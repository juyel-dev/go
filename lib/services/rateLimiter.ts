/**
 * rateLimiter -- docs/API.md §3.
 *
 * Fixed-window counters stored in the same KV namespace as the link-metadata
 * cache (`LINKS_KV`), under a `RATE:` prefix so they're trivially
 * distinguishable and never collide with slug keys (slugs are validated to
 * be alphanumeric via the nanoid alphabet / user input regex, never
 * containing a literal colon).
 *
 * Budget note: writes here count against the same 1,000/day KV write budget
 * as cache repopulation (ARCHITECTURE.md §7) -- one write per rate-limited
 * action attempt, not per click, so this stays comfortably within budget at
 * MVP traffic.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const { env } = getCloudflareContext();
  const kv = env.LINKS_KV;
  const rateKey = `RATE:${key}`;

  const current = await kv.get(rateKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= limit) {
    return { allowed: false, retryAfterSeconds: windowSeconds };
  }

  await kv.put(rateKey, String(count + 1), { expirationTtl: windowSeconds });
  return { allowed: true };
}

/** Limits from docs/API.md §3. */
export const RATE_LIMITS = {
  anonymousLinkCreate: { limit: 10, windowSeconds: 60 * 60 }, // 10/hour/IP
  authenticatedLinkCreate: { limit: 100, windowSeconds: 60 * 60 }, // 100/hour/user
  passwordAttempt: { limit: 5, windowSeconds: 10 * 60 }, // 5/10min/IP+link
} as const;
