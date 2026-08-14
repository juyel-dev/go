import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import * as workspaceService from "@/lib/services/workspaceService";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/**
 * Auth guard for the whole (dashboard) route group -- FOLDER_STRUCTURE.md.
 * Server-side session check; unauthenticated visitors never see a flash of
 * dashboard content before being redirected.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceResult = await workspaceService.getDefaultForUser(user.id);
  const workspace = workspaceResult.ok ? workspaceResult.data : null;

  return (
    <DashboardShell userEmail={user.email ?? ""} workspaceName={workspace?.name ?? "Workspace"}>
      {children}
    </DashboardShell>
  );
}
