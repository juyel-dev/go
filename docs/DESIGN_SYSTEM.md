# Design System — "go"

**Status:** Draft v1 (agreed in chat 2026-08-02)
**Direction:** Corporate / professional / trustworthy (Bitly-adjacent), system-preference dark/light, shadcn/ui + Tailwind
**Last updated:** 2026-08-02

---

## 1. Design Thesis

"go" is infrastructure, not a toy. The people using it are trusting it to keep their links alive and their click data accurate — the UI should read like a precision instrument, not a marketing gimmick. Every generic "AI SaaS" look (warm cream + serif hero, black background + neon accent, zero-radius broadsheet) is deliberately avoided here — none of them say "reliable infrastructure."

**Signature element:** every piece of *data* in the product — link slugs, click counts, dates, API keys, timestamps — is rendered in a monospaced face with tabular figures. Everything else (labels, navigation, prose) uses a clean grotesque sans. This single, consistent rule is what makes the product feel engineered and precise without needing decoration.

---

## 2. Color Tokens

Two-tone blue system: a deep navy for structure/trust, a brighter azure for action/interactivity. Semantic colors are desaturated enough to sit calmly in a data-dense dashboard.

### Light mode
| Token | Hex | Use |
|---|---|---|
| `--background` | `#FFFFFF` | page background |
| `--surface` | `#F7F8FA` | cards, sidebar |
| `--border` | `#E4E7EC` | dividers, table borders |
| `--foreground` | `#101828` | primary text |
| `--muted-foreground` | `#475467` | secondary text |
| `--primary` | `#1B3A6B` | nav, headers, primary structure |
| `--accent` | `#2F6FED` | buttons, links, active states, focus ring |
| `--accent-foreground` | `#FFFFFF` | text on accent |
| `--success` | `#12B76A` | active link status |
| `--warning` | `#F79009` | expiring soon |
| `--destructive` | `#F04438` | expired / delete actions |

### Dark mode
| Token | Hex | Use |
|---|---|---|
| `--background` | `#0B1220` | page background |
| `--surface` | `#131B2C` | cards, sidebar |
| `--border` | `#24304A` | dividers |
| `--foreground` | `#F2F4F7` | primary text |
| `--muted-foreground` | `#94A3B8` | secondary text |
| `--primary` | `#3B5C93` | nav, structure (lightened for dark contrast) |
| `--accent` | `#5B8DEF` | buttons, links, active states |
| `--accent-foreground` | `#0B1220` | text on accent |
| `--success` | `#32D583` | |
| `--warning` | `#FDB022` | |
| `--destructive` | `#F97066` | |

Default mode follows `prefers-color-scheme` (system), with a manual toggle stored per-browser (not per-account in MVP — account-level preference sync is a cheap Phase 2 add).

All token pairs meet WCAG AA contrast (4.5:1 body text, 3:1 large text/icons) in both modes.

---

## 3. Typography

Single family, used with intention rather than two clashing display faces — restraint fits the "trustworthy infrastructure" brief better than a flashy pairing.

- **Sans (UI + headings + body):** `Geist Sans` — geometric-humanist, neutral, highly legible at small sizes. Weights: 600/700 for headings, 400/500 for body and labels.
- **Mono (all data — the signature element):** `Geist Mono` with `font-variant-numeric: tabular-nums` — used for: link slugs, destination URLs, click counts, dates/timestamps, API keys, workspace IDs. Never used for prose or navigation labels.

### Type scale (Tailwind-based, rem)
| Role | Size | Weight | Line height |
|---|---|---|---|
| Display (marketing hero only) | 3rem / 48px | 700 | 1.1 |
| H1 (page title) | 1.875rem / 30px | 700 | 1.2 |
| H2 (section) | 1.25rem / 20px | 600 | 1.3 |
| Body | 0.875rem / 14px | 400 | 1.5 |
| Small / caption | 0.75rem / 12px | 500 | 1.4 |
| Data (mono) | 0.875rem / 14px | 500 | 1.4 |

---

## 4. Layout

- **App shell:** fixed left sidebar (240px, collapsible to icon-only at 64px) + top bar (workspace switcher, search, account menu) + main content area. Standard, predictable SaaS dashboard shape — for infrastructure tools, predictability is a feature, not a lack of imagination.
- **Spacing scale:** Tailwind default (4px base unit — 1, 2, 3, 4, 6, 8, 12, 16...).
- **Radius:** `--radius: 0.5rem` (8px) — soft enough to feel modern, restrained enough to stay "corporate," never pill-shaped/bubbly buttons.
- **Breakpoints:** mobile-first; sidebar collapses to a bottom-sheet/hamburger drawer below `768px`. All dashboard tables become stacked cards below `640px`.
- **Data tables:** the primary UI pattern for the links list and analytics — sticky header, tabular-mono numeric columns right-aligned, row-level actions revealed on hover (desktop) / always visible (mobile).

---

## 5. Components (shadcn/ui + Tailwind)

Base library: shadcn/ui, customized to the token set above (never default shadcn zinc/slate theme — every color pulled from §2).

MVP component inventory: Button, Input, Select, Dialog, Dropdown Menu, Table, Tabs, Badge (link status: active/expired/paused), Toast (action confirmations), Tooltip, Avatar, Skeleton (loading states), Sidebar nav, Command palette (quick slug search — cheap to add with shadcn, high perceived polish), Chart (Recharts, wrapped to match tokens) for analytics.

Icons: `lucide-react`, 1.5px stroke weight, 20px in navigation/table rows, 16px inline with text.

---

## 6. Motion

Minimal and purposeful — this is a tool people use daily, not a page they admire once. Hover/focus transitions: 150ms ease-out on color/background only (no movement). No scroll-triggered animation in the dashboard. The one place motion is allowed to be a moment: the public marketing/landing page hero, where a single deliberate load-in sequence is appropriate — everything past the fold stays calm.

Reduced-motion (`prefers-reduced-motion`) is respected everywhere: transitions collapse to instant.

---

## 7. Voice & Content Guidelines

- **Active voice, plain terms.** A button says exactly what happens: "Create link," not "Submit." The label that creates a link is followed by a toast that says "Link created" — same vocabulary through the whole flow.
- **Name things by what people control**, not how the system is built: "Link settings," not "Metadata config." "Team members," not "workspace_members."
- **Errors are specific and actionable, never apologetic:** "This slug is already taken — try another." not "Oops! Something went wrong."
- **Empty states are an invitation to act:** e.g. first-time links list: "No links yet. Shorten your first URL to see it here." with the create action right there — not a decorative illustration doing the talking instead of copy.
- **Status badges use plain words:** Active / Expired / Paused / Password protected — never internal enum values.

---

*Next: `FOLDER_STRUCTURE.md`, `SCREENS.md` (every screen + user flow), `ADMIN_PANEL.md`, `EDGE_CASES.md`.*
