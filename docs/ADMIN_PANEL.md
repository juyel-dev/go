# Admin Panel — "shrtly"

**Status:** Draft v1
**Last updated:** 2026-08-02

---

## 1. Access Model

- A single boolean/role flag on the user, not a workspace role: `auth.users.app_metadata.is_super_admin` (Supabase Auth custom claim — set manually via SQL for the founder account in MVP; a proper admin-invite flow is Phase 2).
- Admin routes (`app/admin/**`) are guarded at the middleware level (reject non-admins before render) **and** at the service layer (`adminService` functions re-check the claim server-side — never trust the client-set route guard alone).
- All admin actions use the `service_role` Supabase client (server-only, never sent to browser) so RLS is deliberately bypassed only in this one, tightly audited code path.
- Every admin action writes an `event_log` row (`workspace.admin_action` type) — full audit trail from day one.

## 2. Screens

### 2.1 Overview
System-wide health snapshot: total workspaces, total links (active/expired), total clicks (24h/7d), Supabase DB size vs free-tier 500MB cap, KV write-budget usage today (vs 1,000/day cap) — this last one matters because it's the tightest free-tier constraint in the whole system (see ARCHITECTURE.md §7) and the founder needs to see it trending before it becomes a problem.

### 2.2 User & Workspace Management
Searchable table of workspaces (owner email, plan, link count, created date). Actions: suspend workspace (sets a `suspended` flag checked at link-creation and redirect time), view workspace's links, impersonate-for-support is explicitly **out of scope** for MVP (real security/privacy risk — revisit only with proper audit logging and time-boxed sessions in a later phase).

### 2.3 Link Moderation
Searchable/filterable list of all links platform-wide (by destination domain, slug, workspace, reported status). Primary action: **Take down** (destination-URL-level or single-link) with a required reason field — sets `is_active = false`, logs the event, and the owner's dashboard shows the "taken down" state (see SCREENS.md §4) instead of silently disappearing.

## 3. Abuse Prevention (ties into link creation, not just moderation)

- At creation time (`linkService.create`), destination URL checked against a lightweight denylist (known URL-shortener abuse patterns, obvious phishing keyword heuristics) — MVP-level heuristic, not a full Safe Browsing integration (that's a Phase 2 upgrade once there's a paid tier funding the API cost).
- Manual reporting: a "Report this link" action on the public "link not found/redirecting" interstitial is **not** in MVP scope (adds a public-facing report queue and moderation workflow that's disproportionate before there's real traffic) — flagged here so it isn't forgotten, targeted for Phase 2.

---

*Next: `EDGE_CASES.md` — then code scaffolding begins.*
