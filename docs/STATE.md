# Project State — "go"

> This file exists so a new AI chat session can read the repo and immediately continue work
> without needing the human to re-explain context. Always read this file first.

**Last updated:** 2026-08-01

## Current Phase
**Planning Phase** — writing foundational docs before any code is written.
Workflow rule (human-set): **discuss and get explicit agreement in chat BEFORE writing/pushing any new doc.**
Small, previously-agreed updates to existing docs (like this one) can be pushed directly.

## Decisions locked in so far
- Product: production-grade multi-user SaaS URL shortener (not a hobby project)
- Zero cost to start: Cloudflare Pages (free) + Cloudflare Workers KV (free) + Supabase (free)
- No custom domain for MVP — app lives at `https://go.pages.dev`, short links at `https://go.pages.dev/{slug}`
- Auth: Supabase Auth, both anonymous quick-shorten AND full account dashboard supported
- Redirect architecture: Cloudflare edge middleware → KV cache (metadata JSON) → Supabase Postgres on cache miss
- Click analytics logged directly to Supabase (never to KV, due to 1,000 writes/day KV limit)
- Reserved-slug list required because short links share the domain root with app routes
- **Ultra-modular architecture required:** Domain-Driven Modular Monolith — Links, Analytics, Auth,
  Workspaces, Billing, Notifications, Admin each as self-contained modules with clean interfaces
- **Design for Phase 3 now, build incrementally:** schema/interfaces accommodate future features
  (A/B variants, webhooks, teams/roles) from day one without being built/exposed until needed
- **Service Layer Pattern (agent-ready by design):** ALL business logic lives in typed, pure
  functions in `lib/services/`. UI, API routes, and future MCP server all call the same functions —
  never direct DB access from UI/API layer.
- **Internal Event Bus:** domain events (`link.created`, `link.clicked`, `link.expired`, etc.)
  emitted at the source. MVP has one listener (click logging to Supabase). Phase 2/3 features
  (webhooks, AI anomaly detection, Slack notifications) are new listeners, not core rewrites.
- **AI strategy:** NOT building AI features now (explicitly deferred to Phase 3). But architecture
  must make Phase 3 AI additions (MCP server, AI insights, anomaly detection) pure additions, not
  rewrites — this is why the Service Layer + Event Bus + typed dimensional analytics data exist.
  Human's stated reasoning: AI will increasingly control/drive software; codebase must stay
  legible and extensible to both human and AI maintainers.

## Completed
- [x] Competitive research (Dub.co, Bitly, Short.io, Rebrandly, Cutt.ly)
- [x] Free-tier limits research (Cloudflare KV/Workers, Supabase)
- [x] `docs/PRD.md` written
- [x] `docs/ARCHITECTURE.md` written (incl. Service Layer Pattern + Event Bus + AI-readiness section)
- [x] `docs/DATABASE.md` written (full schema, RLS policies, anonymous-link 7-day expiry + claim flow, event_log)
- [x] `docs/API.md` written (service layer signatures, Server Actions + reserved /api/v1/, KV-based rate limiting)
- [x] `docs/DESIGN_SYSTEM.md` written (corporate/trustworthy direction, system dark/light, Geist Sans + Geist Mono
      signature — mono tabular figures for all data, shadcn/ui token mapping)

## In Progress / Next Up
- [ ] `docs/FOLDER_STRUCTURE.md` — finalized Next.js project structure
- [ ] `docs/DESIGN_SYSTEM.md` — UI design system
- [ ] `docs/SCREENS.md` — every screen + user flow
- [ ] `docs/EDGE_CASES.md`
- [ ] `docs/ADMIN_PANEL.md`
- [ ] Then: scaffold the actual Next.js project

## Open Questions for Human
(none blocking right now)

## How to resume in a new chat session
Tell Claude: "go repo দেখে state.md পড়ে কাজ শুরু করো" — Claude will read this file, check
`docs/` for what's already written, and continue from "In Progress / Next Up". Remember: discuss
before writing new docs, per the human's explicit workflow preference.
