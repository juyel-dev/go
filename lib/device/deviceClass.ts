/**
 * Device-adaptive screens -- docs/FOLDER_STRUCTURE.md §3.
 * Parsed once in middleware.ts from the User-Agent header, stored in a
 * cookie so SSR renders the right screen variant on first paint (no
 * layout flash). Client components fall back to a CSS-breakpoint check
 * via useDeviceClass() if the cookie is stale (resize, rotation).
 */
export type DeviceClass = "mobile" | "tablet" | "desktop";

export function classifyUserAgent(ua: string | null): DeviceClass {
  if (!ua) return "desktop";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android(?!.*Tablet)|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export const DEVICE_COOKIE_NAME = "device-class";
