# Product Requirements Document — "shrtly"

**Status:** Draft v1
**Last updated:** 2026-08-01
**Owner:** AI Engineering Lead (Claude) + Product Owner (Juyel)

---

## 1. Vision

"shrtly" is a production-grade, ultra-modular URL shortener SaaS — a self-hosted alternative to Dub.co / Bitly / Short.io, built to run at **zero cost** on free tiers (Cloudflare Pages + Cloudflare Workers KV + Supabase), while following the same architectural discipline as venture-backed link management platforms.

It is not a weekend hobby project. It is designed to scale from a free-tier MVP into a paid, multi-tenant SaaS product without requiring a rewrite.

## 2. Target Users

- **Primary (MVP):** Public, self-serve users — anyone can shorten a link instantly without login (quick-shorten), and optionally create an account for a full dashboard.
- **Secondary (Phase 2+):** Small teams / creators / marketers who need branded links, analytics, and collaboration.

## 3. Competitive Positioning

Researched: Dub.co, Bitly, Short.io, Rebrandly, Cutt.ly, TinyURL (Aug 2026).

Key differentiators identified in the market:
- Dub.co: open developer-first architecture, real-time analytics, conversion tracking, deep tool integrations (Stripe, Slack, Zapier).
- Bitly: strong dashboard, enterprise-grade reliability, but higher pricing and limited custom domains on lower tiers.
- Short.io: generous free tier, but a more complex/technical dashboard.
- Rebrandly: multi-brand/multi-domain focus.

**"shrtly" positioning:** A modern, self-hosted, zero-cost-to-start link platform combining Dub.co-style UX (folders, tags, real-time analytics, QR codes) with full ownership of data (your own Supabase project, your own Cloudflare account) — no vendor lock-in, no per-click billing surprises.

## 4. Feature Scope

### 4.1 MVP (Phase 1) — free-tier, zero cost, no custom domain

- Public "quick shorten" (no login required) at `shrtly.pages.dev`
- Full auth (Supabase Auth: email/password + Google OAuth)
- Dashboard: create/edit/delete/archive links
- Custom slug + auto-generated slug (nanoid-based, collision-checked)
- Reserved-word protection (see ARCHITECTURE.md) so slugs can't collide with app routes
- Short link format: `https://shrtly.pages.dev/{slug}`
- Click analytics: total clicks, click-through time series, device, browser, OS, country, referrer
- QR code auto-generated per link
- Link expiration (date-based and/or click-count-based)
- Password-protected links
- Workspace model (every user gets a default workspace; multi-workspace ready for Phase 2 teams)
- Folder/tag-based link organization
- Bulk actions: multi-select archive/delete/tag
- Admin panel (super-admin role): user management, global link moderation, abuse/spam takedown, system health dashboard
- Abuse prevention: rate limiting on link creation (per-IP and per-account), malicious URL / phishing domain check on creation
- Fully responsive, mobile-first UI

### 4.2 Phase 2 — growth features

- Custom domain support (bring-your-own-domain via Cloudflare for SaaS or manual CNAME + Pages custom domain)
- Team workspaces with roles (owner/admin/member) and invitations
- Public API + API key management for developers
- UTM builder
- Link-in-bio micro-pages
- Geo/device-based conditional redirects
- Custom social preview (OG title/image override)
- Stripe billing — Free vs Pro tier

### 4.3 Phase 3 — advanced/competitive parity

- A/B testing between multiple destinations
- Webhooks + native Zapier/Slack integration
- White-label / custom branding for agencies
- Bot-click filtering and fraud detection
- AI-assisted insights (anomaly detection on click patterns)

## 5. Non-Functional Requirements

- **Cost:** $0 infrastructure cost until real usage/revenue justifies upgrading (Cloudflare Paid Workers $5/mo, Supabase Pro $25/mo are the first upgrade triggers).
- **Performance:** Redirect response time target < 100ms globally (edge-cached via KV).
- **Availability:** Mitigate Supabase free-tier 7-day inactivity pause via scheduled GitHub Actions heartbeat.
- **Security:** Row Level Security on every table, no client ever gets direct unrestricted DB access, rate limiting on all public write endpoints, password-protected links hashed (never stored plaintext).
- **Scalability:** Architecture must allow swapping "shrtly.pages.dev" for a custom domain, and free tier for paid tier, without schema or code rewrites — only configuration changes.

## 6. Out of Scope (for now)

- Native mobile apps
- On-premise/self-hosted installer for third parties
- Enterprise SSO/SAML

## 7. Success Metrics (post-launch)

- Link creation success rate > 99.5%
- Redirect latency p95 < 150ms
- Zero data loss incidents
- Uptime > 99.9% (excluding intentional free-tier pause windows, which should be fully mitigated)

---

*Next docs: `ARCHITECTURE.md` (system design), `DATABASE.md` (schema + RLS), `API.md`, `DESIGN_SYSTEM.md`, `FOLDER_STRUCTURE.md`.*
