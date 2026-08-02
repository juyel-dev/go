# Project State — "shrtly"

> This file exists so a new AI chat session can read the repo and immediately continue work
> without needing the human to re-explain context. Always read this file first.

**Last updated:** 2026-08-02

## Current Phase
**Planning phase COMPLETE.** Moving into code scaffolding next.
Workflow rule (human-set): discuss and get explicit agreement in chat before writing docs that
involve subjective/product decisions. For implementation work that follows already-agreed docs,
proceed directly (human's explicit instruction: "ar besi alochona korte hobe na, proceed").

## Decisions locked in (see docs/ for full detail)
- Production-grade multi-user SaaS URL shortener, zero cost to start
- Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Cloudflare Pages + Workers KV,
  Supabase Postgres + Auth
- No custom domain in MVP — `https://shrtly.pages.dev/{slug}`
- Redirect: edge middleware → KV metadata cache (cache-aside) → Supabase on miss
- Anonymous quick-shorten (7-day expiry, cookie-based claim-on-signup) + full auth dashboard
- Ultra-modular: Domain-Driven Modular Monolith, Service Layer pattern (all business logic in
  `lib/services/`, UI/API/future-MCP never touch DB directly), internal Event Bus
- Schema and interfaces designed for Phase 2/3 (teams, webhooks, A/B testing, API keys, custom
  domains) from day one — tables exist, features don't ship until their phase
- AI strategy: no AI features built now; Service Layer + Event Bus + typed dimensional analytics
  data specifically chosen so Phase 3 AI/MCP additions are additive, not rewrites
- Design: corporate/professional/trustworthy direction, system-preference dark/light mode,
  Geist Sans (UI) + Geist Mono with tabular figures (all data — the signature element)
- Device-adaptive screens: mobile/tablet/desktop composition files sharing one data/hook layer,
  device-class cookie set by middleware from User-Agent, CSS-breakpoint fallback
- Plugin registry formalizing the Event Bus — MVP features built AS plugins so the pattern is
  proven, not retrofitted, when Phase 2/3 features arrive
- Rate limiting: app-level via KV counters (not Cloudflare's paid-tier rate limit rules)
- Full screen inventory, user flows, empty/error-state copy, admin panel spec, and edge
  cases/failure modes are documented — see docs/SCREENS.md, ADMIN_PANEL.md, EDGE_CASES.md

## Completed (all in docs/)
- [x] PRD.md — product vision, competitive research, MVP/Phase2/Phase3 scope
- [x] ARCHITECTURE.md — redirect flow, reserved paths, security model, service layer, event bus,
      Supabase keepalive strategy, free-tier budget table
- [x] DATABASE.md — full schema, RLS policies (SQL), anonymous-link claim flow, event_log,
      public redirect-resolution view, maintenance jobs
- [x] API.md — service layer function signatures, Server Actions + reserved /api/v1/,
      KV-based rate limiting, error handling convention
- [x] DESIGN_SYSTEM.md — color tokens (light/dark), typography, layout, shadcn component
      inventory, motion rules, voice/content guidelines
- [x] FOLDER_STRUCTURE.md — full repo layout, device-adaptive screen pattern, plugin registry
- [x] SCREENS.md — every screen, core user flows, empty/error state copy
- [x] ADMIN_PANEL.md — access model, screens, abuse prevention
- [x] EDGE_CASES.md — link lifecycle, anonymous/claim, free-tier limits, data lifecycle,
      redirect edge cases

## Naming
- **Product/brand name:** "shrtly" — this is the public-facing name used in all docs, UI copy,
  and the live URL (`https://shrtly.pages.dev`).
- **GitHub repo name:** stays `go` (internal codename — repos are hard to rename cleanly once
  cloned/linked; not worth the churn for an internal identifier).
- **Supabase project name:** stays `go` (same reasoning — internal infra label, not user-facing).
- Human should not be surprised seeing "go" in repo URLs / Supabase dashboard while the product
  itself is called "shrtly" everywhere else — this is intentional, not an inconsistency bug.

## Infra Setup Progress
- [x] Supabase project created: name "go" (internal project/codename, unrelated to product brand),
      project_id `ioitmtstrryvjkypaexq`, region ap-south-1,
      org ebjsoxwjbizaawjeelde, cost $0/mo (free tier)
- [x] Cloudflare Pages project created: name `shrtly`, live at `https://shrtly.pages.dev`,
      production branch `main`, build command `npx @cloudflare/next-on-pages@1`,
      destination dir `.vercel/output/static`
- [x] Cloudflare Workers KV namespace created: `go-links-cache`
      (id `d080141c8a9d4441a82d944dbce60b4c`), bound as `LINKS_KV` in both production and
      preview deployment configs of the Pages project
- [x] Old Cloudflare Pages project (originally named `go`, before the `go.pages.dev` subdomain
      was found to be globally taken) was deleted after `shrtly` was created — no orphaned
      resources left behind
- [x] Full DB schema applied (all tables from DATABASE.md: workspaces, workspace_members, folders,
      links, clicks, event_log + future-ready domains/link_variants/webhook_subscriptions/api_keys)
- [x] Triggers: auto-create default workspace on signup, click_count denormalization, updated_at
- [x] RLS enabled + policies applied on every table
- [x] public_link_resolution view created for anonymous redirect-resolution reads
- [x] Security hardening: view set to security_invoker, function search_path pinned,
      handle_new_user/increment_link_click_count EXECUTE revoked from anon/authenticated/public
      (trigger-only functions must never be directly callable via PostgREST RPC)
- [x] Performance hardening: added all missing FK indexes, wrapped auth.uid() in (select ...) in
      every RLS policy, consolidated links INSERT policies where sensible
- [x] Security advisor: 0 warnings. Performance advisor: only expected "unused index" (no data yet)
      and one accepted multiple-permissive-policy trade-off on links INSERT (anon vs member insert
      are genuinely different conditions — kept separate for readability)
- Note for future session: the Supabase project has NOT yet had `pg_cron` expired-link cleanup job
  or auth email templates configured — still pending.

## In Progress / Next Up
- [ ] Set up Cloudflare Pages project + KV namespace
- [ ] Set up `pg_cron` job for expired anonymous link cleanup (DATABASE.md §6)
- [ ] Set up GitHub Actions: CI (lint/typecheck/build), Cloudflare Pages deploy, Supabase keepalive
- [ ] Scaffold the actual Next.js project per FOLDER_STRUCTURE.md
- [ ] Generate TypeScript types from Supabase schema
- [ ] Implement Service Layer (linkService first — it's the critical path)
- [ ] Implement middleware (reserved-path check + slug resolution + device detection)
- [ ] Build MVP screens starting with: public quick-shorten, dashboard links list

## Open Questions for Human
(none blocking)

## How to resume in a new chat session
Tell Claude: "go repo দেখে state.md পড়ে কাজ শুরু করো" — Claude will read this file, check
`docs/` for what's already decided, and continue from "In Progress / Next Up". Discuss subjective/
product decisions before writing; proceed directly on implementation that follows agreed docs.
