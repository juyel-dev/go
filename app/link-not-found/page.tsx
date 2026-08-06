import Link from "next/link";
import { Button } from "@/components/ui/button";

// Copy per docs/SCREENS.md §4 -- explains what happened, in the interface's voice.
export default function LinkNotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Link not found</h1>
      <p className="max-w-sm text-muted-foreground">
        We couldn&apos;t find that link. Check the URL and try again.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go to shrtly</Link>
      </Button>
    </main>
  );
}
