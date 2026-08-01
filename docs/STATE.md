# Project State — "go"

> This file exists so a new AI chat session can read the repo and immediately continue work
> without needing the human to re-explain context. Always read this file first.

**Last updated:** 2026-08-01

## Current Phase
**Planning Phase** — writing foundational docs before any code is written.

## Decisions locked in so far
- Product: production-grade multi-user SaaS URL shortener (not a hobby project)
- Zero cost to start: Cloudflare Pages (free) + Cloudflare Workers KV (free) + Supabase (free)
- No custom domain for MVP — app lives at `https://go.pages.dev`, short links at `https://go.pages.dev/{slug}`
- Auth: Supabase Auth, both anonymous quick-shorten AND full account dashboard supported
- Redirect architecture: Cloudflare edge middleware → KV cache (metadata JSON) → Supabase Postgres on cache miss
- Click analytics logged directly to Supabase (never to KV, due to 1,000 writes/day KV limit)
- Reserved-slug list required because short links share the domain root with app routes

## Completed
- [x] Competitive research (Dub.co, Bitly, Short.io, Rebrandly, Cutt.ly)
- [x] Free-tier limits research (Cloudflare KV/Workers, Supabase)
- [x] `docs/PRD.md` written
- [x] `docs/ARCHITECTURE.md` written

## In Progress / Next Up
- [ ] `docs/DATABASE.md` — full Postgres schema + RLS policies
- [ ] `docs/API.md` — API/server-action contracts
- [ ] `docs/DESIGN_SYSTEM.md` — UI design system
- [ ] `docs/FOLDER_STRUCTURE.md` — finalized Next.js project structure
- [ ] `docs/SCREENS.md` — every screen + user flow
- [ ] `docs/EDGE_CASES.md`
- [ ] `docs/ADMIN_PANEL.md`
- [ ] Then: scaffold the actual Next.js project

## Open Questions for Human
(none blocking right now — proceeding with database schema design next)

## How to resume in a new chat session
Tell Claude: "go repo দেখে state.md পড়ে কাজ শুরু করো" — Claude will read this file, check
`docs/` for what's already written, and continue from "In Progress / Next Up".
