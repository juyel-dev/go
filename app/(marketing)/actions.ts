"use server";

import { cookies } from "next/headers";
import * as linkService from "@/lib/services/linkService";
import type { Result } from "@/lib/services/types";
import type { Link } from "@/lib/services/linkService";

const CLAIM_COOKIE = "claim_tokens";

/**
 * Public quick-shorten -- docs/SCREENS.md §2.1.
 * Server Action, thin wrapper over linkService (ARCHITECTURE.md §8) -- no
 * business logic lives here. workspace_id/created_by are omitted, so
 * linkService.create() applies the anonymous 7-day-expiry + claim-token path.
 */
export async function quickShorten(destinationUrl: string): Promise<Result<Link>> {
  const result = await linkService.create({ destinationUrl });

  if (result.ok && result.data.claimToken) {
    await appendClaimToken(result.data.claimToken);
  }

  return result;
}

/** Adds a new anonymous link's claim token to the browser's claim cookie,
 *  deduped, capped at 20 tokens (a person is not going to claim more than
 *  that in one sitting -- keeps the cookie small). */
async function appendClaimToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CLAIM_COOKIE)?.value;
  let tokens: string[] = [];
  if (existing) {
    try {
      tokens = JSON.parse(existing);
    } catch {
      tokens = [];
    }
  }
  tokens = [...new Set([...tokens, token])].slice(-20);
  cookieStore.set(CLAIM_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // matches the 7-day anonymous link expiry
  });
}
