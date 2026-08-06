"use server";

import * as linkService from "@/lib/services/linkService";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * docs/SCREENS.md §2.3 -- password-gate flow.
 * Looks the link up by slug, then delegates to linkService.verifyPassword.
 * Rate limiting (5 attempts / 10 min / IP+link) is a Phase-1-critical TODO --
 * see docs/API.md §3 -- to be wired in once the KV rate-limit helper lands.
 */
export async function unlockLink(slug: string, password: string) {
  const supabase = createServiceRoleClient();
  const { data: row } = await supabase
    .from("links")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!row) {
    return { ok: false as const, error: { code: "NOT_FOUND" as const, message: "We couldn't find that link." } };
  }

  return linkService.verifyPassword(row.id, password);
}
