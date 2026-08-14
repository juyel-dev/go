import { createClient } from "@/lib/supabase/server";
import * as linkService from "@/lib/services/linkService";
import * as workspaceService from "@/lib/services/workspaceService";
import { LinksScreen } from "@/screens/links/LinksScreen";
import { CreateLinkDialog } from "./create-link-dialog";

export default async function LinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout already redirects if there's no user, but keep this defensive --
  // a page should never trust an upstream guard alone.
  if (!user) return null;

  const workspaceResult = await workspaceService.getDefaultForUser(user.id);
  const links = workspaceResult.ok
    ? await linkService.listForWorkspace(workspaceResult.data.id)
    : { ok: false as const, error: { code: "NOT_FOUND" as const, message: "" } };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shrtly.myself-juyel-dev.workers.dev";

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold">Links</h1>
        <CreateLinkDialog />
      </div>
      <LinksScreen links={links.ok ? links.data : []} appUrl={appUrl} />
    </div>
  );
}
