// TODO(next up): super-admin guard (middleware + adminService re-check) --
// see docs/ADMIN_PANEL.md §1.
export default function AdminPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-muted-foreground">Coming next -- admin panel.</p>
    </main>
  );
}
