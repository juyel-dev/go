# Edge Cases & Failure Modes — "go"

**Status:** Draft v1
**Last updated:** 2026-08-02

---

## 1. Link Lifecycle

| Case | Handling |
|---|---|
| Slug collision on auto-generate | Retry with a new nanoid (up to 5 attempts) before failing with a clear error — collision probability is negligible at MVP scale but the retry loop costs nothing. |
| User requests a reserved-word slug | Rejected at both client validation and server (`RESERVED_SLUG` error code) — see ARCHITECTURE.md §3. |
| Destination URL points back to `go.pages.dev` itself | Rejected at creation — prevents redirect loops. |
| Destination URL is malformed / not a real URL | Zod validation rejects before hitting the service layer. |
| Link edited while someone is mid-redirect (race) | KV is the source of truth for in-flight requests; the edit invalidates KV synchronously (ARCHITECTURE.md §2) so the *next* request gets fresh data — the in-flight one completes with whatever it already read. Acceptable: a redirect completing a few hundred ms "stale" is not a correctness problem. |
| Password-protected link, wrong password submitted repeatedly | Rate-limited 5/10min per IP+link (API.md §3) — prevents brute force without needing CAPTCHA in MVP. |
| Link reaches `max_clicks` exactly mid-burst of concurrent requests | Click count is denormalized and incremented via DB trigger, not read-then-write in app code — avoids a race where two simultaneous requests both see "1 click remaining" and both succeed. Slight over-count tolerance (link might allow 1-2 clicks past the limit under heavy concurrency) is an accepted MVP trade-off over adding distributed locking. |

## 2. Anonymous Link / Claim Flow

| Case | Handling |
|---|---|
| User clears cookies before claiming | Links become unclaimable (by design — the claim token lives only in the cookie, never emailed/exposed). They simply expire in 7 days like any other unclaimed anonymous link. No account-recovery flow for this in MVP — flagged as an accepted limitation, not a bug. |
| User creates 50 anonymous links before signing up | Rate limit (10/hour/IP, API.md §3) caps this at the creation layer regardless of claim intent. |
| Two different people share a network (same IP) and both create anonymous links, then only one signs up | Claim is cookie-scoped, not IP-scoped — the signing-up user only sees links their own browser created, not their network-mate's. |
| Anonymous link claimed, then the claiming account is later deleted | Standard cascade: link's `workspace_id` cascades per the owning workspace's deletion policy (see §4) — not treated specially just because it started anonymous. |

## 3. Free-Tier Infrastructure Limits

| Case | Handling |
|---|---|
| KV write budget (1,000/day) approached | Admin overview surfaces today's usage (ADMIN_PANEL.md §2.1). Writes only happen on link create/edit/cache-repopulation — not clicks — so this should have wide headroom until real growth; when it becomes a real risk, the fix is a paid Workers plan ($5/mo), not a redesign. |
| Supabase 500MB storage approached | `clicks` table grows fastest. Mitigation path (Phase 2, not built now): periodic aggregation of old raw click rows into daily rollup summaries, keeping raw rows for a shorter retention window. Documented here so it isn't a surprise later. |
| Supabase project paused despite keepalive (e.g. workflow fails silently) | GitHub Actions failure notifications go to the repo owner's email by default — no extra monitoring needed for MVP scale. |
| Cloudflare Pages free request limit (100K/day) hit | At MVP traffic this is a "good problem" signal (real usage) — the response is upgrading to a paid plan, not an architecture change, since the whole system was designed to degrade gracefully into the next pricing tier rather than requiring a rewrite. |

## 4. Data & Account Lifecycle

| Case | Handling |
|---|---|
| Workspace owner deletes their account | All owned links, folders, and workspace data cascade-delete (Postgres `on delete cascade` from `auth.users` → `workspaces` → `links`/`folders`). A confirmation step ("This deletes N links permanently") is required in the UI — not just a DB-level safeguard. |
| Last admin/owner tries to leave a multi-member workspace (Phase 2) | Blocked — a workspace must always have at least one owner. Flagged now so the `workspace_members` RLS/service logic accounts for it when team features ship. |
| User's browser timezone vs server timestamps | All timestamps stored `timestamptz` (UTC) in DB; formatted client-side to the visitor's local timezone — never stored or compared in local time. |

## 5. Redirect Edge Cases

| Case | Handling |
|---|---|
| Bot/crawler hits a short link (e.g. link preview unfurling from Slack/Twitter) | `is_bot` flagged via User-Agent heuristic in the click record (DATABASE.md `clicks.is_bot`) so analytics aren't inflated by unfurl bots — the redirect still happens normally (bots need to follow it to generate the preview). |
| Extremely long destination URL (near Postgres `text` practical limits) or destination URL containing a redirect back through another shortener (open-redirect chaining risk) | Length-capped at creation (2048 chars, matches practical browser URL limits); chained-shortener destinations are allowed (not our job to police the general web) but logged, not specially trusted. |

---

*Planning phase docs complete. Next: scaffold the actual Next.js + Supabase + Cloudflare Pages project per FOLDER_STRUCTURE.md.*
