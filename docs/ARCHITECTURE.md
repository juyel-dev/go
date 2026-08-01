# System Architecture — "go"

**Status:** Draft v1
**Last updated:** 2026-08-01

---

## 1. High-Level Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind | Modern, server-first, edge-deployable |
| Hosting | Cloudflare Pages (`@cloudflare/next-on-pages` adapter) | Free tier, global edge network, native KV bindings |
| Redirect cache | Cloudflare Workers KV | Sub-ms edge reads, free tier sufficient for MVP traffic |
| Database | Supabase Postgres | Managed Postgres + Auth + RLS, generous free tier |
| Auth | Supabase Auth | Email/password + OAuth, integrates directly with RLS |
| CI/CD | GitHub Actions → Cloudflare Pages | GitHub is single source of truth |

No custom domain in MVP. Public URL: `https://go.pages.dev`. Short links: `https://go.pages.dev/{slug}`.

## 2. Redirect Flow (Cache-Aside Pattern)

```
Incoming request → Next.js Middleware (runs on Cloudflare edge)
   │
   ▼
Is path a reserved app route? (see §3)
   │
   ├── YES → pass through to Next.js routing (dashboard, auth, admin, api, etc.)
   │
   └── NO  → treat first path segment as a short-link slug
         │
         ▼
      KV.get(slug)
         │
         ├── HIT (JSON: { url, is_active, expires_at, has_password, password_hash })
         │      │
         │      ├── !is_active OR expired            → render "Link not found/expired" page
         │      ├── has_password                      → render password-gate page
         │      │        └── on correct submit → 302 redirect + async click log
         │      └── else                               → 302 redirect immediately
         │                                                 + ctx.waitUntil(logClick()) [non-blocking]
         │
         └── MISS → query Supabase (`select * from links where slug = $1 and workspace_id is not null`)
                │
                ├── FOUND → KV.put(slug, metadata, { expirationTtl: 86400 })
                │            → repeat HIT logic above
                │
                └── NOT FOUND → 404 "Link not found" page
```

### Why metadata in KV, not just the destination URL
Because links can be password-protected or expiring, a naive cache of `slug → destination` would leak protected content or serve expired links after cache population. Caching the **full metadata object** keeps the edge authoritative without a DB round-trip on every hit.

### Click logging (avoiding KV write-limit exhaustion)
Cloudflare KV free tier allows only 1,000 writes/day account-wide — nowhere near enough for one write per click. Click events are therefore:
1. **Never** written to KV.
2. Inserted directly into Supabase (`clicks` table) using `ctx.waitUntil()` so the redirect response is not delayed.
3. Cache metadata writes to KV only happen on: link creation, link edit, cache miss (repopulation), or explicit invalidation (edit/delete/expire) — comfortably within the 1,000/day budget for expected MVP traffic.

### Cache invalidation
On link update/delete/pause from the dashboard, the server action calls `KV.delete(slug)` (or overwrites it) synchronously so stale metadata never lingers.

## 3. Reserved Path Strategy

Because short links live at the domain root (no `/s/` or `/r/` prefix, no custom domain in MVP), every single-segment path is a candidate slug **unless** it collides with an app route. A static reserved-word list is enforced in two places:

1. **At slug creation time** (server-side validation — reject reserved words).
2. **At middleware level** (reserved paths always route to the Next.js app, never to slug resolution).

Reserved list (extensible, stored in `lib/reserved-slugs.ts` and mirrored in DB constraint):
`login, signup, logout, dashboard, admin, api, settings, workspace, workspaces, docs, about, pricing, terms, privacy, help, support, blog, _next, favicon.ico, robots.txt, sitemap.xml, s, r, qr`

## 4. Application Structure (Next.js App Router — preview)

```
app/
  (marketing)/            → public landing page, pricing, terms
  (auth)/login, signup    → Supabase Auth flows
  (dashboard)/            → authenticated area (links, analytics, settings)
  admin/                  → super-admin only, protected by role check + RLS
  api/                    → route handlers (server actions preferred where possible)
middleware.ts             → reserved-path check + slug resolution (redirect engine)
lib/
  supabase/                → typed client (server + browser variants)
  kv/                      → typed KV helper functions
  reserved-slugs.ts
  validators/               → zod schemas
components/
  ui/                       → design-system primitives
  links/, analytics/, admin/
```

*(Full folder structure will be finalized in `FOLDER_STRUCTURE.md`.)*

## 5. Security Model

- **RLS everywhere:** every table scoped by `workspace_id`; a user can only read/write rows in workspaces they belong to. Super-admin role bypasses via a dedicated `service_role` server-only client, never exposed to the browser.
- **Password-protected links:** password hashed (bcrypt/argon2) before storage — never compared in plaintext, never cached in plaintext in KV beyond the hash.
- **Rate limiting:** public quick-shorten endpoint rate-limited per IP (Cloudflare) to prevent spam/abuse; authenticated endpoints rate-limited per user.
- **Malicious URL protection:** on link creation, destination URL checked against a lightweight denylist/heuristic (expand to a real Safe Browsing-style API in Phase 2) before the link is allowed to go live.
- **Secrets:** all credentials (Supabase service key, Cloudflare tokens) live only in GitHub Actions secrets / Cloudflare Pages environment variables — never committed to the repo.

## 6. Reliability: Supabase Free-Tier Pause Mitigation

Supabase free-tier projects pause after 7 days without API activity. Mitigation: a GitHub Actions scheduled workflow (`.github/workflows/keepalive.yml`) runs daily, performing a trivial authenticated query against Supabase. This keeps the project active indefinitely at zero cost.

## 7. Free-Tier Budget Awareness (reference)

| Resource | Free limit | MVP risk |
|---|---|---|
| Cloudflare Workers/Pages requests | 100K/day | Low |
| Cloudflare KV reads | 100K/day | Low |
| Cloudflare KV writes | 1K/day | Medium — must stay disciplined (see §2) |
| Supabase DB storage | 500MB | Low initially |
| Supabase MAU | 50,000 | Low initially |
| Supabase inactivity pause | 7 days | Mitigated via keepalive workflow |

## 8. Deployment Pipeline

```
git push → GitHub main branch
   │
   ▼
GitHub Actions: lint + typecheck + build
   │
   ▼
Cloudflare Pages build (via @cloudflare/next-on-pages)
   │
   ▼
Deploy to go.pages.dev
```

On deployment failure: read Cloudflare Pages build logs → identify root cause → fix → commit → push → redeploy (autonomous loop, per project instructions).

---

*Next: `DATABASE.md` (full schema + RLS policies), `API.md`, `DESIGN_SYSTEM.md`, `FOLDER_STRUCTURE.md`.*
