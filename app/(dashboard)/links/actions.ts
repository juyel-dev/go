"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import * as linkService from "@/lib/services/linkService";
import * as workspaceService from "@/lib/services/workspaceService";
import type { Result } from "@/lib/services/types";
import type { Link } from "@/lib/services/linkService";

export async function createDashboardLink(input: {
  destinationUrl: string;
  slug?: string;
}): Promise<Result<Link>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "FORBIDDEN", message: "You need to be logged in." } };
  }

  const workspaceResult = await workspaceService.getDefaultForUser(user.id);
  if (!workspaceResult.ok) return workspaceResult;

  const result = await linkService.create({
    destinationUrl: input.destinationUrl,
    slug: input.slug || undefined,
    workspaceId: workspaceResult.data.id,
    createdBy: user.id,
  });

  if (result.ok) revalidatePath("/links");
  return result;
}
