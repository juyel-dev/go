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

## RESOLVED (this session)
- GitHub Actions was blocked (0 runs triggered, workflow_dispatch returned 500) until the human
  added a LICENSE file and made the repo public -- unclear exactly which fixed it, but Actions
  now runs normally. If this recurs on a future repo, check for a LICENSE file and repo visibility
  as first troubleshooting steps.
- `SUPABASE_SERVICE_ROLE_KEY` provided by human, set as a GitHub secret.
- **Critical bug found and fixed:** Supabase Keepalive workflow was failing with HTTP 500 /
  Postgres error `42P17 infinite recursion detected in policy for relation "workspace_members"`.
  The `workspace_members` RLS SELECT policy queried `workspace_members` from within its own
  policy, causing infinite recursion. Fixed via a `SECURITY DEFINER` helper function
  `is_workspace_member(ws_id uuid)` that checks membership without re-triggering RLS -- the
  standard Supabase-recommended pattern for this exact problem. ALL policies that used the
  `workspace_id in (select ... from workspace_members where user_id = auth.uid())` subquery
  pattern were rewritten to call this function instead (workspaces, workspace_members, folders,
  links, clicks, event_log, domains, link_variants, webhook_subscriptions, api_keys).
  Security advisor shows 2 expected WARN-level notices (function is callable via RPC by
  anon/authenticated) -- accepted, since it only returns a boolean and RLS policies require
  EXECUTE to function at all.
- **App is live:** deployed via GitHub Actions to Cloudflare Workers. URL:
  `https://shrtly.myself-juyel-dev.workers.dev`. All references to the old (never-actually-live)
  `shrtly.pages.dev` URL updated across docs, .env.example, and app code. Added
  `NEXT_PUBLIC_APP_URL` as a GitHub secret, wired into both CI and deploy workflows.
- All 3 GitHub Actions workflows (CI, Deploy, Supabase Keepalive) confirmed green.

## RESOLVED (bug found after user tested the live app)
- **Critical bug:** "Shorten" button on the live site failed with a server error. Root cause:
  Cloudflare Workers secrets were never actually set on the deployed Worker -- GitHub Actions
  secrets are only available at BUILD time (inlined for `NEXT_PUBLIC_*` vars by Next.js's
  compiler), but non-public server-only vars like `SUPABASE_SERVICE_ROLE_KEY` need to be bound
  as actual Cloudflare Worker secrets (`wrangler secret put` / Cloudflare API) to be readable via
  `process.env` at RUNTIME on Cloudflare. `createServiceRoleClient()` was being called with an
  undefined key, so every anonymous link creation (and click logging in middleware.ts) failed.
  Fixed by: (1) setting all 4 needed secrets on the live Worker directly via the Cloudflare API
  as an immediate fix, and (2) adding a "Sync runtime secrets to the Worker" step to
  `deploy.yml` (`wrangler secret put`) so this stays correct on every future deploy, not just
  this one-off fix. **This is an important OpenNext-on-Cloudflare gotcha worth remembering for
  any future service/route that reads non-`NEXT_PUBLIC_` env vars.**

## RESOLVED -- major redirect-engine bug hunt (Aug 2026 session)
Shortening worked, but visiting a short link 404'd. Root-caused through several layered bugs,
found using `wrangler tail` triggered via a temporary GitHub Actions workflow (the only way to
get real production logs, since this sandbox's network allowlist blocks both
`*.supabase.co` and `*.workers.dev` directly, and GitHub's own job logs redirect to Azure Blob
Storage which is also blocked -- annotations via the Checks API were the workaround that
actually worked for pulling data back).

1. **`run_worker_first` missing in wrangler.jsonc `assets` config.** Cloudflare Workers Static
   Assets defaults to `run_worker_first: false` (cost optimization) -- any request not matching a
   static file gets served the static-asset 404 fallback WITHOUT the Worker script (and therefore
   middleware) ever running at all. Fixed by setting `run_worker_first: true`.
2. **`public_link_resolution` view returned zero rows for anon requests.** An earlier security
   fix set `security_invoker = true` on the view (to satisfy a generic advisor warning), which
   made it respect the underlying `links` table's RLS -- but anon has no SELECT policy on `links`
   (only INSERT, for anonymous link creation), so the view returned nothing. Reverted to
   `security_invoker = false`: safe here specifically because the view's column list (never
   including `password_hash`, `created_by`, `workspace_id`) IS the security boundary, by design.
3. **`link-not-found`, `link-expired`, `unlock` were missing from `lib/reserved-slugs.ts`**,
   so middleware treated the app's own utility routes as candidate short-link slugs when visited
   directly. Fixed -- see ARCHITECTURE.md §3.
4. **Root cause of the actual 404 (found last): a confirmed `@opennextjs/cloudflare` bug** where
   a *cross-origin* `NextResponse.redirect()` issued directly from `middleware.ts` (the
   separately-bundled Edge runtime chunk) gets silently turned into a 404 by Cloudflare's Workers
   routing -- the `Location` header stays correct (this is what made it diagnosable), but the
   status/body become a generic Next.js 404 page. Fixed by moving the actual redirect
   construction to a new Route Handler, `app/api/redirect/route.ts` (main server bundle, not the
   Edge middleware bundle) -- middleware now only resolves the slug and REWRITES to
   `/api/redirect?to=...&linkId=...`. See ARCHITECTURE.md §2 for the full explanation.
5. Also fixed along the way: Cloudflare Worker **runtime secrets were never bound** (GitHub
   Actions secrets are build-time only; `SUPABASE_SERVICE_ROLE_KEY` etc. needed `wrangler secret
   put`, now automated in `deploy.yml`); a **separate critical bug** -- infinite recursion
   (`42P17`) in the `workspace_members` RLS policy, fixed via a `SECURITY DEFINER` helper function
   `is_workspace_member()`; eslint was linting `.open-next/**` build output (thousands of false
   positives), now ignored.

**Confirmed working end-to-end via `wrangler tail`-verified test: `bMjLTUC` → 302 → correct
external destination URL.** Human has not yet re-confirmed manually in a browser, but the
underlying bug is fixed and verified server-side.

## In Progress / Next Up
0. **Have the human do one final manual browser confirmation** that shortening + visiting a link
   works end-to-end (should now work, but hasn't been eyeballed in-browser since the fix)
1. Generate real Supabase TypeScript types, replace the `lib/supabase/types.ts` placeholder
2. Update ARCHITECTURE.md §5 to reflect PBKDF2 (not bcrypt/argon2) for password hashing
3. Build real auth flow (Supabase Auth email/password + Google OAuth) for `/login`, `/signup`
4. Build the device-adaptive Links screen (`screens/links/*.mobile.tsx` /
   `.tablet.tsx` / `.desktop.tsx` per FOLDER_STRUCTURE.md §3) wired to `linkService.listForWorkspace`
5. Build the claim-anonymous-links post-signup flow (SCREENS.md §2.1)
6. Wire up rate limiting (API.md §3 -- KV counters) on link creation and password attempts --
   currently NOT implemented, anonymous create endpoint is unprotected right now
7. Dashboard home, link detail/analytics screen, admin panel (all still TODO stubs)
8. Manually verify `https://shrtly.myself-juyel-dev.workers.dev` in a real browser end-to-end
   (create an anonymous link, confirm redirect works) -- Claude could not verify directly, the
   sandbox's network allowlist blocks `*.workers.dev`

## How to resume in a new chat session
Tell Claude: "go repo দেখে state.md পড়ে কাজ শুরু করো" -- Claude reads this file, checks the two
BLOCKING items first (Actions unblocked? service role key provided?), and continues from
"In Progress / Next Up" otherwise.
