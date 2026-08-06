// TODO(next up): device-adaptive LinksScreen (mobile/tablet/desktop) wired
// to linkService.listForWorkspace() -- see docs/FOLDER_STRUCTURE.md §3,
// docs/SCREENS.md §3.
export default function LinksPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Your links</h1>
      <p className="text-muted-foreground">Coming next -- device-adaptive Links screen.</p>
    </main>
  );
}
