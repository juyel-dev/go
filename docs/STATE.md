# Project State — "go"

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
- No custom domain in MVP — `https://go.pages.dev/{slug}`
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

## In Progress / Next Up
- [ ] Scaffold the actual Next.js project per FOLDER_STRUCTURE.md
- [ ] Set up Cloudflare Pages project + KV namespace
- [ ] Set up Supabase project ("go" doesn't exist yet as a Supabase project — currently only
      "AI Autopilot" and "TEST_PROJECT" exist in the account)
- [ ] Run initial DB migration from DATABASE.md schema
- [ ] Set up GitHub Actions: CI (lint/typecheck/build), Cloudflare Pages deploy, Supabase keepalive
- [ ] Implement Service Layer (linkService first — it's the critical path)
- [ ] Implement middleware (reserved-path check + slug resolution + device detection)
- [ ] Build MVP screens starting with: public quick-shorten, dashboard links list

## Open Questions for Human
(none blocking)

## How to resume in a new chat session
Tell Claude: "go repo দেখে state.md পড়ে কাজ শুরু করো" — Claude will read this file, check
`docs/` for what's already decided, and continue from "In Progress / Next Up". Discuss subjective/
product decisions before writing; proceed directly on implementation that follows agreed docs.
