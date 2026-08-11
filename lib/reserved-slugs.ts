/**
 * Slugs that can never be used for a short link, because they collide with
 * app routes living at the domain root. See docs/ARCHITECTURE.md §3.
 *
 * This list is enforced in two places:
 *   1. linkService.create() -- server-side validation (this file)
 *   2. middleware.ts -- reserved paths always route to the Next.js app
 */
export const RESERVED_SLUGS = new Set([
  "login",
  "signup",
  "logout",
  "dashboard",
  "admin",
  "api",
  "settings",
  "workspace",
  "workspaces",
  "docs",
  "about",
  "pricing",
  "terms",
  "privacy",
  "help",
  "support",
  "blog",
  "claim",
  "link-not-found",
  "link-expired",
  "unlock",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "s",
  "r",
  "qr",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
