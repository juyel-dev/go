# Folder Structure — "go"

**Status:** Draft v1 (agreed in chat 2026-08-02)
**Last updated:** 2026-08-02

---

## 1. Top-Level Structure

```
go/
├── app/                          # Next.js App Router — routes only, no business logic
│   ├── (marketing)/              # public landing, pricing, terms, privacy
│   ├── (auth)/                   # login, signup
│   ├── (dashboard)/              # authenticated app shell
│   │   ├── links/
│   │   ├── analytics/
│   │   ├── settings/
│   │   └── [plugin routes mount here — see §4]
│   ├── admin/                    # super-admin only
│   ├── api/v1/                   # reserved, empty in MVP (see API.md §1)
│   └── middleware.ts             # reserved-path check, slug resolution, device detection
│
├── screens/                      # device-adaptive screen compositions (see §3)
│   ├── links/
│   ├── analytics/
│   └── dashboard-home/
│
├── components/
│   ├── ui/                       # shadcn/ui primitives, themed to design tokens
│   └── shared/                   # cross-device composed components (Badge, StatusPill, etc.)
│
├── lib/
│   ├── services/                 # business logic — see ARCHITECTURE.md §8, API.md §2
│   │   ├── linkService.ts
│   │   ├── analyticsService.ts
│   │   ├── workspaceService.ts
│   │   ├── adminService.ts
│   │   ├── kvCacheService.ts
│   │   └── eventBus.ts
│   ├── plugins/                  # plugin registry + built-in plugins — see §4
│   │   ├── registry.ts
│   │   └── core/                 # MVP features implemented AS plugins (see §4)
│   ├── supabase/                 # typed server + browser clients
│   ├── device/                   # UA parsing, device-class cookie helpers — see §3
│   ├── reserved-slugs.ts
│   └── validators/                # zod schemas, shared client+server
│
├── hooks/                        # shared data/state hooks (useLinks, useAnalytics...) — device-agnostic
├── styles/                       # Tailwind config, design tokens (design_system.md source of truth)
├── supabase/
│   ├── migrations/                # SQL migrations (DATABASE.md is the spec, this is the implementation)
│   └── functions/                 # pg_cron jobs, etc.
├── .github/workflows/             # CI, deploy, Supabase keepalive
└── docs/                          # this documentation set
```

---

## 2. Rule: `app/` Never Contains Business Logic

Route files in `app/` only: read the URL/params, call a `screens/*` component (for pages) or a `lib/services/*` function (for actions), and render. This mirrors the Service Layer rule in ARCHITECTURE.md §8 — it's what keeps routing, UI, and logic independently replaceable.

---

## 3. Device-Adaptive Screens

For screens complex enough to need genuinely different layouts per device (Links list, Analytics, Dashboard home), each has three composition files sharing one data layer:

```
screens/links/
  LinksScreen.mobile.tsx     ← card list, bottom-sheet actions, single column
  LinksScreen.tablet.tsx     ← condensed 2-column table
  LinksScreen.desktop.tsx    ← full data table, hover row actions, side panel
  LinksScreen.tsx            ← picks the right one (see below), no markup of its own
```

```ts
// screens/links/LinksScreen.tsx
export function LinksScreen(props: LinksScreenProps) {
  const device = useDeviceClass(); // reads cookie set by middleware, CSS-breakpoint fallback
  if (device === "mobile") return <LinksScreenMobile {...props} />;
  if (device === "tablet") return <LinksScreenTablet {...props} />;
  return <LinksScreenDesktop {...props} />;
}
```

- **Data/state/logic is 100% shared** — all three variants consume the same hook (e.g. `useLinks()`), which itself calls `linkService` (never duplicated).
- **Small components stay shared** — Button, Input, Badge, etc. from `components/ui/` and `components/shared/` are never forked per device.
- **Device detection:** `middleware.ts` parses the `User-Agent` header, sets a `device-class` cookie (`mobile` \| `tablet` \| `desktop`) so the correct variant renders server-side on first paint — no flash of the wrong layout. `useDeviceClass()` falls back to a CSS-breakpoint-based client check if the cookie is stale (e.g. window resized, device rotated).
- Screens that genuinely don't need device-specific layout (e.g. Settings forms) stay as a single responsive component — this pattern is opt-in per screen, not forced everywhere.

---

## 4. Plugin System

Formalizes the Event Bus (ARCHITECTURE.md §8) into a real extension point. A plugin can subscribe to domain events, register a nav item + route, and ship independently of the core app.

```ts
// lib/plugins/registry.ts
export type Plugin = {
  name: string;
  listensTo?: EventType[];
  onEvent?: (event: DomainEvent) => Promise<void>;
  navItem?: { label: string; route: string; icon: string; roles?: Role[] };
  routes?: PluginRouteDef[];
};

export function registerPlugin(plugin: Plugin): void;
export function getActivePlugins(): Plugin[];
```

**MVP features are themselves built as built-in plugins** (`lib/plugins/core/click-logging.ts`, `lib/plugins/core/expiry-cleanup.ts`) — not because they need to be optional, but so the pattern is proven and consistent from day one, rather than retrofitted when the first "real" optional plugin (webhooks, AI insights) arrives in Phase 2/3.

**Adding a Phase 2/3 feature later means:** writing one new file in `lib/plugins/`, registering it — core redirect/link/analytics code is never touched. The dashboard nav updates automatically from `getActivePlugins()`.

---

## 5. Naming & Conventions

- Files: `camelCase.ts` for logic, `PascalCase.tsx` for components.
- One default export per file where practical; named exports for utilities.
- No default exports from `lib/services/*` — always named, for clean tree-shaking and explicit imports.
- Tests colocated: `linkService.test.ts` next to `linkService.ts` (Phase 2 — test framework decision deferred, not blocking MVP).

---

*Next: `SCREENS.md` (every screen + user flow, per device where relevant), `ADMIN_PANEL.md`, `EDGE_CASES.md`.*
