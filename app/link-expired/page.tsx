import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LinkExpiredPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Link expired</h1>
      <p className="max-w-sm text-muted-foreground">
        This link has expired and is no longer active.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go to shrtly</Link>
      </Button>
    </main>
  );
}
