"use server";

import * as linkService from "@/lib/services/linkService";
import type { Result } from "@/lib/services/types";
import type { Link } from "@/lib/services/linkService";

/**
 * Public quick-shorten -- docs/SCREENS.md §2.1.
 * Server Action, thin wrapper over linkService (ARCHITECTURE.md §8) -- no
 * business logic lives here. workspace_id/created_by are omitted, so
 * linkService.create() applies the anonymous 7-day-expiry + claim-token path.
 */
export async function quickShorten(destinationUrl: string): Promise<Result<Link>> {
  return linkService.create({ destinationUrl });
}
