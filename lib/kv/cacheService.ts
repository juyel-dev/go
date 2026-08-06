/**
 * kvCacheService -- ARCHITECTURE.md §2, API.md §2.
 *
 * Thin, typed wrapper around the Cloudflare KV binding (`LINKS_KV`, declared
 * in wrangler.jsonc). Caches the FULL link metadata object, not just the
 * destination URL -- see ARCHITECTURE.md §2 for why (password/expiry checks
 * must stay authoritative at the edge without a DB round-trip on cache hit).
 *
 * KV write budget is 1,000/day on the free tier -- writes here only happen on
 * link create/edit/cache-repopulation, NEVER on click (clicks go straight to
 * Supabase, see lib/plugins/core/click-logging.ts).
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type LinkKVMeta = {
  id: string;
  slug: string;
  destinationUrl: string;
  isActive: boolean;
  expiresAt: string | null;
  maxClicks: number | null;
  clickCount: number;
  hasPassword: boolean;
};

const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24h -- see DATABASE.md §5 view + ARCHITECTURE.md §2

function getKV() {
  const { env } = getCloudflareContext();
  return env.LINKS_KV;
}

export async function getLinkMeta(slug: string): Promise<LinkKVMeta | null> {
  const raw = await getKV().get(slug, "json");
  return (raw as LinkKVMeta | null) ?? null;
}

export async function setLinkMeta(
  slug: string,
  meta: LinkKVMeta,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  await getKV().put(slug, JSON.stringify(meta), { expirationTtl: ttlSeconds });
}

export async function invalidate(slug: string): Promise<void> {
  await getKV().delete(slug);
}
