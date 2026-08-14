import Link from "next/link";
import { Link2, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";

/**
 * Standard, predictable SaaS dashboard shape (DESIGN_SYSTEM.md §4) --
 * fixed sidebar + top bar. Plugin nav items (FOLDER_STRUCTURE.md §4) would
 * merge into this list once Phase 2/3 plugins register one; core nav is
 * hardcoded for MVP since there's nothing to merge yet.
 */
export function DashboardShell({
  children,
  userEmail,
  workspaceName,
}: {
  children: React.ReactNode;
  userEmail: string;
  workspaceName: string;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-4 sm:flex">
        <div className="mb-6 px-2">
          <span className="text-lg font-semibold">shrtly</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          <Link
            href="/links"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Link2 className="size-4" />
            Links
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <p className="truncate px-2 text-xs text-muted-foreground">{workspaceName}</p>
          <p className="truncate px-2 text-xs text-muted-foreground">{userEmail}</p>
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" type="submit">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar -- sidebar collapses per DESIGN_SYSTEM.md §4 breakpoints.
          A full drawer/hamburger implementation is a follow-up; this keeps
          the mobile view usable (nav links inline) without blocking launch. */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:hidden">
          <span className="text-lg font-semibold">shrtly</span>
          <nav className="flex gap-3 text-sm">
            <Link href="/links">Links</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
