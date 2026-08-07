import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { classifyUserAgent, DEVICE_COOKIE_NAME } from "@/lib/device/deviceClass";
import type { LinkKVMeta } from "@/lib/kv/cacheService";

/**
 * IMPORTANT -- do NOT rename this file to `proxy.ts` / rename the exported
 * function to `proxy`, even though Next.js 16's upgrade guide recommends it.
 * @opennextjs/cloudflare does not yet support the Node.js-runtime `proxy`
 * convention (fails with "Node.js middleware is not currently supported" at
 * build/deploy time as of Aug 2026). The legacy `middleware.ts` (Edge
 * runtime) file is the only convention that currently works when deploying
 * to Cloudflare Workers via OpenNext. Revisit this once OpenNext ships
 * Node.js middleware support -- track via their GitHub issues.
 */

/**
 * ARCHITECTURE.md §2 -- the redirect engine.
 * Runs on every request. Reserved paths and multi-segment paths pass through
 * to the Next.js app untouched; a single-segment path is treated as a
 * candidate short-link slug and resolved via KV (cache-aside over Supabase).
 */
export async function middleware(request: NextRequest) {
  try {
    return await handleMiddleware(request);
  } catch (e) {
    // TEMPORARY diagnostic wrapper -- see docs/STATE.md "debugging redirect bug".
    // Remove once the root cause of the production redirect failure is confirmed.
    const message = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e);
    return new Response(`MIDDLEWARE_DEBUG_ERROR:\n${message}`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}

async function handleMiddleware(request: NextRequest) {
  const response = setDeviceCookie(request);

  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  // Reserved app routes, or anything nested (not a bare `/slug`), pass through.
  if (segments.length !== 1 || isReservedSlug(segments[0])) {
    return response;
  }

  const slug = segments[0];
  const { env } = getCloudflareContext();
  const kv = env.LINKS_KV;

  let meta: LinkKVMeta | null = null;
  const cached = await kv.get(slug, "json");
  if (cached) {
    meta = cached as LinkKVMeta;
  } else {
    // Cache miss -- resolve via the public_link_resolution view (never the
    // raw `links` table -- see DATABASE.md §5) using the anon key over REST,
    // since middleware runs at the edge without a Node Postgres driver.
    const resolved = await resolveFromSupabase(slug);
    if (resolved) {
      meta = resolved;
      await kv.put(slug, JSON.stringify(resolved), { expirationTtl: 60 * 60 * 24 });
    }
  }

  if (!meta) {
    return NextResponse.rewrite(new URL("/link-not-found", request.url));
  }

  const isExpired =
    !meta.isActive ||
    (meta.expiresAt && new Date(meta.expiresAt) < new Date()) ||
    (meta.maxClicks !== null && meta.clickCount >= meta.maxClicks);

  if (isExpired) {
    return NextResponse.rewrite(new URL("/link-expired", request.url));
  }

  if (meta.hasPassword) {
    const url = new URL(`/unlock/${slug}`, request.url);
    return NextResponse.rewrite(url);
  }

  // Fire-and-forget click log -- never blocks the redirect. See
  // lib/plugins/core/click-logging.ts and ARCHITECTURE.md §2.
  const ctx = getCloudflareContext();
  ctx.ctx.waitUntil(logClickAsync(request, meta.id));

  return NextResponse.redirect(meta.destinationUrl, { status: 302, headers: response.headers });
}

function setDeviceCookie(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const existing = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
  if (!existing) {
    const deviceClass = classifyUserAgent(request.headers.get("user-agent"));
    response.cookies.set(DEVICE_COOKIE_NAME, deviceClass, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return response;
}

async function resolveFromSupabase(slug: string): Promise<LinkKVMeta | null> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/public_link_resolution?slug=eq.${encodeURIComponent(slug)}&select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{
    id: string;
    slug: string;
    destination_url: string;
    is_active: boolean;
    expires_at: string | null;
    max_clicks: number | null;
    click_count: number;
    has_password: boolean;
  }>;
  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    destinationUrl: row.destination_url,
    isActive: row.is_active,
    expiresAt: row.expires_at,
    maxClicks: row.max_clicks,
    clickCount: row.click_count,
    hasPassword: row.has_password,
  };
}

async function logClickAsync(request: NextRequest, linkId: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clicks`;
  // Cloudflare augments the incoming Request with a `cf` object at runtime;
  // NextRequest's type doesn't declare it, so we extend narrowly here rather
  // than casting to `any`.
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
    // A dropped click event is an acceptable loss; a broken redirect is not.
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and Next internals, so the
     * slug-resolution logic above sees every candidate short link.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
