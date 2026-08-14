/**
 * workspaceService -- docs/API.md §2.
 * Default workspace creation itself happens via a DB trigger
 * (handle_new_user(), see supabase/migrations) so every signup already has
 * exactly one workspace with them as owner by the time any of this runs.
 */
import { createClient } from "@/lib/supabase/server";
import { ok, err, type Result } from "@/lib/services/types";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: string;
};

export async function getForUser(userId: string): Promise<Result<Workspace[]>> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("workspace_members")
    .select("workspace:workspaces(id, name, slug, owner_id, plan)")
    .eq("user_id", userId);

  if (error) return err("UNKNOWN", error.message);

  type JoinedRow = {
    workspace: { id: string; name: string; slug: string; owner_id: string; plan: string } | null;
  };
  const workspaces = ((rows ?? []) as JoinedRow[])
    .map((r) => r.workspace)
    .filter((w): w is NonNullable<JoinedRow["workspace"]> => w !== null)
    .map((w) => ({ id: w.id, name: w.name, slug: w.slug, ownerId: w.owner_id, plan: w.plan }));

  return ok(workspaces);
}

/** Convenience: the workspace used for single-workspace MVP flows (claim,
 *  quick actions) -- just the first one, since every user has exactly one
 *  until Phase 2 multi-workspace UI ships. */
export async function getDefaultForUser(userId: string): Promise<Result<Workspace>> {
  const result = await getForUser(userId);
  if (!result.ok) return result;
  const first = result.data[0];
  if (!first) return err("NOT_FOUND", "No workspace found for this account.");
  return ok(first);
}
