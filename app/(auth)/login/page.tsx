// TODO(next up): wire to Supabase Auth (email/password + Google OAuth) --
// see docs/SCREENS.md screen #3 and docs/STATE.md "In Progress / Next Up".
export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="text-muted-foreground">Coming next -- Supabase Auth wiring.</p>
    </main>
  );
}
