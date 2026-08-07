/**
 * MVP-level heuristic denylist -- docs/ADMIN_PANEL.md §3, EDGE_CASES.md §5.
 * Not a full Safe Browsing integration (that's a funded Phase 2 upgrade).
 * Also blocks destinations pointing back at this app itself (redirect loop).
 */
const APP_HOSTNAMES = ["shrtly.myself-juyel-dev.workers.dev", "localhost"];

const OBVIOUS_ABUSE_PATTERNS = [/paypal-?secure/i, /verify-?account-?now/i, /free-?gift-?card/i];

export function isLikelyMaliciousUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (APP_HOSTNAMES.some((h) => parsed.hostname.endsWith(h))) return true;
    return OBVIOUS_ABUSE_PATTERNS.some((p) => p.test(url));
  } catch {
    return true; // unparseable URL -- reject
  }
}
