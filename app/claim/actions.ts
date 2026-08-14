"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import * as linkService from "@/lib/services/linkService";
import * as workspaceService from "@/lib/services/workspaceService";
import { err, type Result } from "@/lib/services/types";

const CLAIM_COOKIE = "claim_tokens";

export async function getClaimableCount(): Promise<number> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CLAIM_COOKIE)?.value;
  if (!raw) return 0;
  try {
    const tokens = JSON.parse(raw) as string[];
    return Array.isArray(tokens) ? tokens.length : 0;
  } catch {
    return 0;
  }
}

export async function claimLinks(): Promise<Result<{ claimed: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("FORBIDDEN", "You need to be logged in to claim links.");

  const workspaceResult = await workspaceService.getDefaultForUser(user.id);
  if (!workspaceResult.ok) return workspaceResult;

  const cookieStore = await cookies();
  const raw = cookieStore.get(CLAIM_COOKIE)?.value;
  const tokens: string[] = raw ? JSON.parse(raw) : [];

  const result = await linkService.claimAnonymousLinks(tokens, user.id, workspaceResult.data.id);
  if (result.ok) {
    cookieStore.delete(CLAIM_COOKIE);
  }
  return result;
}

export async function skipClaim(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CLAIM_COOKIE);
}
