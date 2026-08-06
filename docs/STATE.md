# Project State — "shrtly" (repo/codename: "go")

> This file exists so a new AI chat session can read the repo and immediately continue work
> without needing the human to re-explain context. Always read this file first.

**Last updated:** 2026-08-06

## Current Phase
**Code scaffolding phase.** Planning is complete (see "Planning Docs" below). Core architecture
and the MVP's critical-path redirect engine are built and pushed. Auth/dashboard UI is next.

Workflow rule (human-set): discuss and get explicit agreement before writing docs involving
subjective/product decisions. For implementation that follows already-agreed docs, proceed
directly without re-discussing every step.

## Naming
- **Product/brand name:** "shrtly"
- **GitHub repo name / Supabase project name:** stay `go` (internal codenames, not renamed to
  avoid churn) -- do not be surprised seeing "go" in repo/Supabase URLs.

## Planning Docs (all complete, in docs/)
PRD.md, ARCHITECTURE.md, DATABASE.md, API.md, DESIGN_SYSTEM.md, FOLDER_STRUCTURE.md, SCREENS.md,
ADMIN_PANEL.md, EDGE_CASES.md -- read these for full product/architecture/design rationale.

## Infra Status

### Supabase (project "go", id `ioitmtstrryvjkypaexq`, region ap-south-1, $0/mo)
- Full schema, RLS (0 security advisor warnings), triggers, public_link_resolution view,
  pg_cron daily expired-anonymous-link cleanup -- all live.
- Password hashing deviates from ARCHITECTURE.md's "bcrypt/argon2" wording: actually implemented
  as salted PBKDF2 (210k iterations, SHA-256) via Web Crypto, because bcrypt/argon2 need native
  bindings unavailable on the Cloudflare Workers edge runtime. This is documented in code
  (lib/services/linkService.ts) -- ARCHITECTURE.md §5 should be updated to match (not yet done).

### Cloudflare
- **Deploy target is Cloudflare Workers via `@opennextjs/cloudflare`, NOT Cloudflare Pages.**
  Course-corrected mid-build: `@cloudflare/next-on-pages` only supports Next.js <=15.5 and is
  effectively deprecated; Cloudflare's own docs now recommend OpenNext (GA Feb 2026).
  The original Cloudflare Pages project (first named `go`, then `shrtly`) was deleted.
  **Live URL is now `<worker-name>.<account-subdomain>.workers.dev` once first deployed** --
  `shrtly.pages.dev` referenced in earlier docs/README is stale and needs updating once the
  actual workers.dev URL (or a custom domain) is confirmed after first deploy.
- KV namespace `go-links-cache` (id `d080141c8a9d4441a82d944dbce60b4c`), bound as `LINKS_KV` in
  wrangler.jsonc (declared in-repo now, not via Pages dashboard binding -- that's the Workers way).
- GitHub Actions secrets set: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **BLOCKING: `SUPABASE_SERVICE_ROLE_KEY` secret still needed** -- Claude cannot fetch this via
  the Supabase MCP (intentionally restricted). Waiting on the human to paste it from Supabase
  dashboard > Settings > API > service_role key.
- **BLOCKING: GitHub Actions is not actually running** -- workflows are registered ("active") but
  zero runs triggered on push, and manual `workflow_dispatch` returns HTTP 500. Likely causes:
  GitHub account phone/email verification pending, or Actions spending limit set to $0. Human
  needs to check GitHub Settings > Billing and plans > Spending limits, and check for any pending
  verification prompts from GitHub. Cannot be diagnosed/fixed via the API from this side.

## Code Scaffold Status (pushed to `main`, commits up to `0dae05a`)
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (components fetched via the
  Shadcn UI MCP tool, since `npx shadcn init` hangs -- `ui.shadcn.com` isn't in the sandbox's
  network allowlist)
- Self-hosted Geist fonts via the `geist` npm package (not `next/font/google`) -- more CI-reliable,
  avoids a network fetch to Google Fonts at build time
- Design tokens (DESIGN_SYSTEM.md §2) implemented in `app/globals.css`, light + dark, wired to
  `next-themes` (`attribute="class"`, `defaultTheme="system"`)
- Built and verified locally: `npx tsc --noEmit` (0 errors), `npx eslint .` (0 errors),
  `next build` (succeeds), `opennextjs-cloudflare build` (succeeds, produces `.open-next/worker.js`),
  `wrangler deploy --dry-run` (validates KV binding correctly) -- **never actually deployed yet**
  (deploy requires reaching api.cloudflare.com, blocked by the sandbox's network allowlist; must
  happen via GitHub Actions, which is currently blocked -- see above)
- **IMPORTANT gotcha recorded in code comments:** kept the file named `middleware.ts` (not
  renamed to `proxy.ts` as Next.js 16's upgrade guide suggests) because `@opennextjs/cloudflare`
  does not yet support the Node.js-runtime `proxy` convention (confirmed via GitHub issues,
  fails with "Node.js middleware is not currently supported"). Revisit once OpenNext adds support.
- Implemented: `lib/services/linkService.ts` (create/getBySlug/listForWorkspace/archive/
  claimAnonymousLinks/verifyPassword), `lib/services/eventBus.ts`, `lib/plugins/registry.ts` +
  one built-in plugin (expiry-cleanup), `lib/kv/cacheService.ts`, `middleware.ts` (full redirect
  engine: reserved-path check -> KV cache-aside -> Supabase fallback -> password/expiry handling
  -> non-blocking click logging via `ctx.waitUntil`), `lib/reserved-slugs.ts`,
  `lib/device/deviceClass.ts`, Supabase server/browser/service-role clients, Zod validators
- Pages built: public quick-shorten landing (`app/(marketing)/page.tsx`, fully wired to
  `linkService.create` via a Server Action), `/link-not-found`, `/link-expired`,
  `/unlock/[slug]` (password-gate flow, fully wired)
- Pages stubbed (placeholder only, marked with TODO comments): `/login`, `/signup`,
  `/(dashboard)/links`, `/admin` -- these are the next real build targets
- `lib/supabase/types.ts` is a placeholder (`Database = any`) -- real types need
  `supabase gen types typescript` wired into a script + CI, not done yet
- GitHub Actions workflows written: `ci.yml` (lint+typecheck+build), `deploy.yml`
  (opennextjs-cloudflare build+deploy), `supabase-keepalive.yml` (daily cron) -- **none have
  successfully run yet, see blocking issue above**

## In Progress / Next Up
1. **Unblock GitHub Actions** (human needs to check billing/verification) -- nothing else deploys
   without this
2. **Get `SUPABASE_SERVICE_ROLE_KEY` from human**, set as GitHub secret
3. Once both unblocked: confirm CI passes, confirm deploy succeeds, get the real
   `*.workers.dev` URL, update it everywhere `shrtly.pages.dev` is currently referenced
   (README.md, PRD.md, ARCHITECTURE.md, .env.example's NEXT_PUBLIC_APP_URL, STATE.md)
4. Generate real Supabase TypeScript types, replace the `lib/supabase/types.ts` placeholder
5. Update ARCHITECTURE.md §5 to reflect PBKDF2 (not bcrypt/argon2) for password hashing
6. Build real auth flow (Supabase Auth email/password + Google OAuth) for `/login`, `/signup`
7. Build the device-adaptive Links screen (`screens/links/*.mobile.tsx` /
   `.tablet.tsx` / `.desktop.tsx` per FOLDER_STRUCTURE.md §3) wired to `linkService.listForWorkspace`
8. Build the claim-anonymous-links post-signup flow (SCREENS.md §2.1)
9. Wire up rate limiting (API.md §3 -- KV counters) on link creation and password attempts --
   currently NOT implemented, anonymous create endpoint is unprotected right now
10. Dashboard home, link detail/analytics screen, admin panel (all still TODO stubs)

## How to resume in a new chat session
Tell Claude: "go repo দেখে state.md পড়ে কাজ শুরু করো" -- Claude reads this file, checks the two
BLOCKING items first (Actions unblocked? service role key provided?), and continues from
"In Progress / Next Up" otherwise.
