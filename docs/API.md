# API & Service Layer Design — "shrtly"

**Status:** Draft v1 (agreed in chat 2026-08-02)
**Last updated:** 2026-08-02

---

## 1. Decision: Server Actions (MVP) + `/api/v1/` reserved (Phase 2+)

- **MVP dashboard and public quick-shorten** call **Next.js Server Actions** directly — no separate REST layer needed for the app itself. Fully type-safe end-to-end, minimal boilerplate, runs on the same edge runtime as the middleware.
- **`/api/v1/...` route handlers are reserved from day one but not built in MVP.** They exist as a namespace so that Phase 2 (public developer API, API keys) and Phase 3 (MCP server adapter) have a stable, versioned home — without ever colliding with reserved-slug logic (`api` is already in the reserved-words list, see ARCHITECTURE.md §3).
- **Critical rule:** Server Actions never contain business logic themselves. Every action is a thin wrapper that calls a function from the Service Layer (`lib/services/`). This is what lets `/api/v1/` and the future MCP adapter reuse identical logic later — see ARCHITECTURE.md §8.

```
app/(dashboard)/links/actions.ts   ─┐
app/(public)/actions.ts            ─┼──▶  lib/services/linkService.ts  ──▶ Supabase / KV / Event Bus
api/v1/links/route.ts (Phase 2)    ─┘
```

---

## 2. Service Layer — Function Signatures

All service functions are pure `async` TypeScript functions, fully typed with Zod-validated input and a consistent `Result<T, E>` return shape (never throw for expected errors — only for truly exceptional/unhandled cases).

```ts
type Result<T, E = ServiceError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

type ServiceError = {
  code: "NOT_FOUND" | "FORBIDDEN" | "RATE_LIMITED" | "RESERVED_SLUG"
      | "SLUG_TAKEN" | "VALIDATION_ERROR" | "EXPIRED" | "UNKNOWN";
  message: string;
};
```

### `linkService`
```ts
create(input: {
  destinationUrl: string;
  slug?: string;                 // omit = auto-generate
  workspaceId?: string | null;   // null = anonymous
  createdBy?: string | null;
  password?: string;
  expiresAt?: string | null;
  maxClicks?: number | null;
  tags?: string[];
  folderId?: string | null;
}): Promise<Result<Link>>

getBySlug(slug: string): Promise<Result<Link>>
listForWorkspace(workspaceId: string, filters?: { folderId?: string; tag?: string }): Promise<Result<Link[]>>
update(linkId: string, actorId: string, patch: Partial<LinkInput>): Promise<Result<Link>>
archive(linkId: string, actorId: string): Promise<Result<void>>
delete(linkId: string, actorId: string): Promise<Result<void>>
claimAnonymousLinks(claimTokens: string[], userId: string, workspaceId: string): Promise<Result<{ claimed: number }>>
verifyPassword(linkId: string, password: string): Promise<Result<{ destinationUrl: string }>>
```

### `analyticsService`
```ts
recordClick(linkId: string, meta: ClickMeta): Promise<Result<void>>   // called via ctx.waitUntil, never blocks redirect
getClicksForLink(linkId: string, range: DateRange): Promise<Result<ClickSummary>>
getWorkspaceOverview(workspaceId: string, range: DateRange): Promise<Result<WorkspaceAnalytics>>
```

### `workspaceService`
```ts
createDefaultForUser(userId: string): Promise<Result<Workspace>>   // called by Supabase auth trigger path
getForUser(userId: string): Promise<Result<Workspace[]>>
inviteMember(workspaceId: string, actorId: string, email: string, role: Role): Promise<Result<void>>  // Phase 2
```

### `adminService` (super-admin only — server_role client)
```ts
listAllUsers(pagination): Promise<Result<User[]>>
suspendWorkspace(workspaceId: string, reason: string): Promise<Result<void>>
takedownLink(linkId: string, reason: string): Promise<Result<void>>
getSystemHealth(): Promise<Result<SystemHealthSnapshot>>
```

### `kvCacheService` (internal — used only by linkService + middleware)
```ts
getLinkMeta(slug: string): Promise<LinkKVMeta | null>
setLinkMeta(slug: string, meta: LinkKVMeta, ttlSeconds?: number): Promise<void>
invalidate(slug: string): Promise<void>
```

### `eventBus` (internal)
```ts
emit(eventType: EventType, payload: object, workspaceId?: string): Promise<void>
// MVP subscriber: click logging only. Future subscribers register here without touching emitters.
```

---

## 3. Rate Limiting Design

Cloudflare's native Rate Limiting rules are limited/paid-tier-oriented, so rate limiting is implemented **at the application layer using Workers KV as a counter store** (fixed-window, cheap on reads, and writes stay within the 1,000/day KV budget because limits apply per-action, not per-click).

| Action | Limit | Scope |
|---|---|---|
| Anonymous link creation | 10 / hour | per IP (`cf-connecting-ip`) |
| Authenticated link creation | 100 / hour | per user |
| Password attempt on protected link | 5 / 10 min | per IP + link_id |
| Login attempts | handled by Supabase Auth's built-in limits | — |

Implementation: `RATE:{action}:{key}` → counter in KV with `expirationTtl` matching the window. On limit exceeded, service layer returns `{ ok: false, error: { code: "RATE_LIMITED" } }` and the UI shows a friendly message — never a raw 429 with no context.

---

## 4. Error Handling Convention

- Service layer never throws for expected business errors (not found, forbidden, rate limited, etc.) — always returns `Result`.
- Server Actions unwrap `Result` and either return a typed response to the client component or redirect/show a toast.
- Unexpected errors (DB connection failure, etc.) are logged (Cloudflare/Supabase logs) and surfaced as a generic "something went wrong" — never leak internals to the client.

---

*Next: `DESIGN_SYSTEM.md`, `FOLDER_STRUCTURE.md`, `SCREENS.md`.*
