import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

/**
 * Server-side Supabase client, scoped to the current user's session via cookies.
 * RLS applies normally -- this client can only see/modify what the signed-in
 * user is allowed to per the policies in supabase/migrations.
 *
 * Use this from Server Components and Server Actions. Never import this into
 * a Client Component.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component -- safe to ignore if you have
            // middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Service-role client -- bypasses RLS entirely. Server-only, never imported
 * into anything that ships to the browser. Used exclusively by:
 *   - adminService (super-admin moderation)
 *   - the click-logging plugin (writes clicks without a user session)
 *   - the redirect-resolution path on KV cache miss (reads public_link_resolution)
 *
 * The service role key must only ever live in server environment variables
 * (Cloudflare Pages/Workers env vars, GitHub Actions secrets) -- see
 * docs/ARCHITECTURE.md §5.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
