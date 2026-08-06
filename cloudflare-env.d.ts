// Ambient types for the Cloudflare bindings declared in wrangler.jsonc.
// See lib/kv/cacheService.ts and middleware.ts for usage.
interface CloudflareEnv {
  LINKS_KV: KVNamespace;
}
