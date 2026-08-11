import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { classifyUserAgent } from "@/lib/device/deviceClass";

/**
 * Cross-origin redirect issuer -- ARCHITECTURE.md §2 (updated).
 *
 * IMPORTANT: this exists as a separate Route Handler (main server bundle,
 * Node.js runtime) rather than issuing the redirect directly from
 * middleware.ts (Edge bundle), because @opennextjs/cloudflare has a
 * confirmed bug where a cross-origin `NextResponse.redirect()` issued FROM
 * MIDDLEWARE gets silently turned into a 404 by Cloudflare's Workers Assets
 * routing layer -- the Location header stays correct, but the status/body
 * become a generic 404 page. Plain `Response.redirect()` from a normal
 * Cloudflare Worker (no Next middleware involved) works fine, which is why
 * moving the actual redirect construction here (a Route Handler, not
 * middleware) sidesteps the bug. middleware.ts only resolves the slug via
 * KV/Supabase and REWRITES here; this route does the final redirect + the
 * non-blocking click log.
 *
 * Reserved path: this route lives under /api/, already in the reserved-slugs
 * list, so it can never collide with a user-created short link.
 */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get("to");
  const linkId = request.nextUrl.searchParams.get("linkId");

  if (!to) {
    return NextResponse.rewrite(new URL("/link-not-found", request.url));
  }

  if (linkId) {
    const ctx = getCloudflareContext();
    ctx.ctx.waitUntil(logClickAsync(request, linkId));
  }

  return Response.redirect(to, 302);
}

async function logClickAsync(request: NextRequest, linkId: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clicks`;
  const cf = (request as NextRequest & { cf?: IncomingRequestCfProperties }).cf;
  await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      link_id: linkId,
      country: cf?.country ?? null,
      city: cf?.city ?? null,
      device_type: classifyUserAgent(request.headers.get("user-agent")),
      referrer: request.headers.get("referer") ?? null,
      is_bot: /bot|crawler|spider|slurp/i.test(request.headers.get("user-agent") ?? ""),
    }),
  }).catch(() => {
    // Click logging must never break the redirect -- swallow errors here.
  });
}
