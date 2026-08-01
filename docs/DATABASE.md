# Database Design — "go"

**Status:** Draft v1 (agreed in chat 2026-08-02)
**Engine:** Supabase Postgres
**Last updated:** 2026-08-02

---

## 1. Design Principles

- Every table that holds user data is scoped by `workspace_id` and protected by Row Level Security (RLS). No table is ever readable/writable by default.
- Anonymous (no-login) usage is a first-class case, not an afterthought — `workspace_id` and `created_by` are nullable on `links` specifically to support it.
- Tables for Phase 2/3 features (`link_variants`, `webhook_subscriptions`, `api_keys`, `domains`) exist from day one so no breaking migration is needed later — they simply have no rows / no UI until their phase ships.
- All timestamps are `timestamptz`, defaulting to `now()`.
- All primary keys are `uuid` (`gen_random_uuid()`), never auto-increment integers (avoids enumeration/guessing of resource IDs).

---

## 2. Core Tables

### `workspaces`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | |
| slug | text unique | reserved-word checked (see ARCHITECTURE.md §3) |
| owner_id | uuid FK → auth.users | |
| plan | text | default `'free'`; `'pro'` in Phase 2 |
| created_at | timestamptz | |

### `workspace_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK → workspaces | |
| user_id | uuid FK → auth.users | |
| role | text | `owner` \| `admin` \| `member`; check constraint |
| invited_at | timestamptz | |
| joined_at | timestamptz nullable | null while invite pending (Phase 2) |

Unique constraint: `(workspace_id, user_id)`.

Every new signup gets exactly one `workspaces` row (their personal default workspace) and one `workspace_members` row with `role = 'owner'`, created automatically via a Postgres trigger on `auth.users` insert.

### `links`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK → workspaces, **nullable** | null = anonymous link |
| created_by | uuid FK → auth.users, **nullable** | null = anonymous link |
| slug | text unique | reserved-word checked at insert (app layer + trigger) |
| destination_url | text | validated (denylist/heuristic check at creation) |
| title | text nullable | |
| favicon_url | text nullable | |
| tags | text[] | default `'{}'` |
| folder_id | uuid FK → folders, nullable | |
| is_active | boolean | default `true` |
| password_hash | text nullable | bcrypt/argon2 hash, never plaintext |
| max_clicks | integer nullable | null = unlimited |
| click_count | integer | default `0`, incremented via trigger on `clicks` insert (denormalized for fast reads) |
| expires_at | timestamptz nullable | **anonymous links: forced `created_at + interval '7 days'`**; account links: user-chosen or null |
| claim_token | uuid nullable | set on anonymous creation; cleared once claimed |
| claimed_at | timestamptz nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `folders`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK → workspaces | |
| name | text | |
| parent_folder_id | uuid FK → folders, nullable | one level of nesting is enough for MVP |
| created_at | timestamptz | |

### `clicks`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| link_id | uuid FK → links | |
| clicked_at | timestamptz | |
| country | text nullable | from Cloudflare `cf-ipcountry` header |
| city | text nullable | |
| device_type | text nullable | `desktop` \| `mobile` \| `tablet` \| `bot` |
| browser | text nullable | |
| os | text nullable | |
| referrer | text nullable | |
| is_bot | boolean | default `false` |

No `user_id` — click data is about visitors, not accounts. Indexed on `(link_id, clicked_at)` for time-series queries.

### `event_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid FK → workspaces, nullable | |
| event_type | text | `link.created` \| `link.claimed` \| `link.expired` \| `link.deleted` \| `workspace.member_added` |
| payload | jsonb | event-specific data |
| created_at | timestamptz | |

Lightweight, lifecycle-only (not click-level — that's `clicks`). Foundation for future audit trail, webhook replay (Phase 2), and AI insight backfill (Phase 3).

---

## 3. Future-Ready Tables (schema now, feature later)

### `domains` (Phase 2 — custom domains)
`id, workspace_id, domain (unique), verified (bool), created_at`

### `link_variants` (Phase 3 — A/B testing)
`id, link_id, destination_url, weight (int), created_at`

### `webhook_subscriptions` (Phase 2/3)
`id, workspace_id, event_type, target_url, secret, is_active, created_at`

### `api_keys` (Phase 2 — public API)
`id, workspace_id, key_hash, name, last_used_at, created_at`

None of these tables have application code touching them in the MVP. They exist purely so Phase 2/3 launches are additive migrations (new columns/indexes at most), never destructive ones.

---

## 4. Row Level Security — Policy Summary

RLS is **enabled on every table** (`alter table ... enable row level security;`). Default posture: deny all, then explicitly allow.

```sql
-- workspaces: members can read; only owner can update/delete
create policy "members can view their workspace"
  on workspaces for select
  using (
    id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "owner can update workspace"
  on workspaces for update
  using (owner_id = auth.uid());

-- workspace_members: members can view their own workspace's member list
create policy "members can view membership"
  on workspace_members for select
  using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

-- links: owners of a workspace can CRUD their own links
create policy "members can manage workspace links"
  on links for all
  using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  )
  with check (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

-- links: anonymous insert allowed (rate-limited at app/edge layer, not DB layer)
create policy "anyone can create an anonymous link"
  on links for insert
  with check (workspace_id is null and created_by is null);

-- links: public can read active links for redirect resolution (edge fallback on KV miss)
-- Restricted to non-sensitive columns via a view (see §5), not the raw table.

-- clicks: only workspace members can read click data for their own links
create policy "members can view clicks on their links"
  on clicks for select
  using (
    link_id in (
      select id from links
      where workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
    )
  );
-- clicks: no direct client insert policy — inserts only via service_role (server-side) after redirect
```

**Super-admin access:** never via RLS bypass on the anon/authenticated role. A dedicated server-only Supabase client using the `service_role` key (stored only in Cloudflare Pages environment variables / GitHub Actions secrets) is used for the admin panel's moderation queries. This key is never sent to the browser.

## 5. Public Redirect-Resolution View

Direct table access to `links` is never granted for anonymous redirect lookups (would expose `password_hash`, `created_by`, etc.). Instead:

```sql
create view public_link_resolution as
select id, slug, destination_url, is_active, expires_at, max_clicks, click_count,
       (password_hash is not null) as has_password
from links;
```

The edge redirect logic (on a KV cache miss) queries this view with the anon key — it gets everything needed to decide redirect/expired/password-gate, but never the actual password hash or owner info.

## 6. Maintenance Jobs

- **Expired anonymous link cleanup:** daily `pg_cron` job (Supabase free tier supports `pg_cron`) marks `is_active = false` where `expires_at < now()` and `workspace_id is null`.
- **Supabase keepalive:** GitHub Actions daily workflow performs a trivial authenticated read — prevents the 7-day free-tier inactivity pause. (Documented in ARCHITECTURE.md §6.)

---

*Next: `API.md` (service-layer + route contracts), `DESIGN_SYSTEM.md`, `FOLDER_STRUCTURE.md`.*
