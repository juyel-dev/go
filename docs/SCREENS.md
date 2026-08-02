# Screens & User Flows — "shrtly"

**Status:** Draft v1
**Last updated:** 2026-08-02

---

## 1. Screen Inventory

| # | Screen | Auth required | Device-adaptive? |
|---|---|---|---|
| 1 | Landing / marketing home | No | Responsive only |
| 2 | Public quick-shorten (embedded in landing) | No | Responsive only |
| 3 | Login | No | Responsive only |
| 4 | Signup | No | Responsive only |
| 5 | Claim anonymous links (post-signup) | Yes | Responsive only |
| 6 | Dashboard home (overview) | Yes | **Adaptive** |
| 7 | Links list | Yes | **Adaptive** |
| 8 | Create/Edit link (modal or page) | Yes | Responsive only |
| 9 | Link detail + analytics | Yes | **Adaptive** |
| 10 | Folders/tags management | Yes | Responsive only |
| 11 | Workspace settings | Yes | Responsive only |
| 12 | Account settings | Yes | Responsive only |
| 13 | Password-gate (public, visiting a protected link) | No | Responsive only |
| 14 | Link expired/not found (public) | No | Responsive only |
| 15 | Admin — overview | Yes (super-admin) | Responsive only |
| 16 | Admin — user/workspace management | Yes (super-admin) | Responsive only |
| 17 | Admin — link moderation | Yes (super-admin) | Responsive only |

---

## 2. Core User Flows

### 2.1 Anonymous quick-shorten → optional claim
```
Landing page → paste URL → "Shorten" → short link shown + QR + copy button
   → banner: "This link expires in 7 days. Sign up to keep it forever."
   → (optional) Sign up → claim-links screen auto-detects cookie-tracked
     anonymous links → "3 links found — add to your account?" → claimed,
     expires_at cleared
```
If the person never signs up, the link simply expires in 7 days (soft-deleted via `pg_cron`, per DATABASE.md §6). No dead-end, no nagging beyond the one banner.

### 2.2 Authenticated link creation
```
Dashboard → Links → "Create link" → form:
  destination URL (required) → custom slug (optional, live availability check
  against reserved-words + DB) → advanced (collapsed by default): expiration,
  max clicks, password, tags, folder
→ "Create" → toast "Link created" → appears at top of Links list
```

### 2.3 Visiting a short link (end-user, not the link owner)
```
GET shrtly.pages.dev/{slug}
  → reserved path?      → yes: normal app route
  → KV hit, active, no password → 302 redirect (< 100ms) + async click log
  → KV hit, password required   → password-gate screen → correct → redirect
  → KV hit, expired/inactive    → "Link not found" screen (not a raw 404 —
                                   explains what happened, in the interface's
                                   voice, per DESIGN_SYSTEM.md §7)
  → KV miss → Supabase lookup → found: cache + redirect | not found: same
                                 "Link not found" screen
```

### 2.4 Admin moderation
```
Admin → Link moderation → search/filter (by domain, reporter, workspace)
  → "Take down" → link.is_active = false, event_log entry, workspace owner
    notified (Phase 2 — MVP: visible in their dashboard as "Taken down by
    admin: <reason>" instead of active)
```

---

## 3. Screen Detail (MVP-critical screens)

### Dashboard Home (Adaptive)
- **Desktop:** left sidebar nav + top row of summary cards (total links, total clicks 30d, top link) + recent links table + simple click trend chart.
- **Tablet:** summary cards wrap to 2 columns, table becomes condensed.
- **Mobile:** summary cards stack vertically (carousel-swipeable), recent links as cards, chart simplified to a single sparkline.
- Data source: `analyticsService.getWorkspaceOverview()` — same hook (`useWorkspaceOverview()`) across all three.

### Links List (Adaptive)
- **Desktop:** full data table — columns: short link (mono), destination (truncated), status badge, clicks (mono, right-aligned), created date (mono), actions on row hover.
- **Tablet:** condensed table — short link, clicks, status, actions in an overflow menu.
- **Mobile:** card list — one link per card, short link + status badge on top row, destination + click count below, tap card to open detail, swipe for quick actions (archive/copy).
- Shared: search/filter bar, folder/tag chips, bulk-select mode (checkbox → bulk archive/delete/tag), all identical across devices — only the list rendering differs.

### Link Detail + Analytics (Adaptive)
- **Desktop:** two-column — left: link metadata + edit controls; right: analytics (time-series chart, device/browser/country breakdown as horizontal bar lists).
- **Tablet:** stacked, metadata card first then analytics below, charts full-width.
- **Mobile:** metadata as a collapsed summary card, analytics in tabs (Overview / Devices / Locations / Referrers) to avoid a long scroll of charts.

### Create/Edit Link
Single responsive form (not device-forked — a form doesn't benefit from three separate layouts, only from correct input sizing). On mobile it's a full-screen sheet; on desktop/tablet a centered modal. Same field order everywhere per DESIGN_SYSTEM.md consistency principle.

---

## 4. Empty & Error States (voice per DESIGN_SYSTEM.md §7)

| State | Copy |
|---|---|
| No links yet | "No links yet. Shorten your first URL to see it here." |
| No search results | "No links match “{query}”. Try a different search or clear filters." |
| Slug taken | "This slug is already taken — try another." |
| Reserved slug | "That word is reserved for the app. Pick a different slug." |
| Link expired (public) | "This link has expired and is no longer active." |
| Link not found (public) | "We couldn't find that link. Check the URL and try again." |
| Rate limited | "You're creating links a little too fast. Try again in a few minutes." |
| Admin takedown notice | "This link was taken down by an administrator: {reason}." |

---

*Next: `ADMIN_PANEL.md`, `EDGE_CASES.md` — then code scaffolding begins.*
