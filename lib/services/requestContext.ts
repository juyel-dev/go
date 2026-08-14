import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting -- docs/API.md §3.
 * Cloudflare always sets `cf-connecting-ip` on requests it proxies; the
 * x-forwarded-for fallback covers local dev / non-Cloudflare environments.
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get("cf-connecting-ip") ??
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
