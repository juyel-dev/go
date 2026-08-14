import { redirect } from "next/navigation";
import { getClaimableCount } from "./actions";
import { ClaimActions } from "./claim-actions";

/**
 * SCREENS.md §2.1 -- shown right after login/signup if the browser has
 * pending anonymous-link claim tokens. Skips straight through if there are
 * none, so a normal returning user never sees this screen.
 */
export default async function ClaimPage() {
  const count = await getClaimableCount();

  if (count === 0) {
    redirect("/links");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">
        {count} link{count === 1 ? "" : "s"} found
      </h1>
      <p className="max-w-sm text-muted-foreground">
        You shortened {count === 1 ? "a link" : "some links"} before signing up. Add{" "}
        {count === 1 ? "it" : "them"} to your account so {count === 1 ? "it" : "they"} never expire?
      </p>
      <ClaimActions />
    </main>
  );
}
