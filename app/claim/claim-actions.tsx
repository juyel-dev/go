"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { claimLinks, skipClaim } from "./actions";

export function ClaimActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      await claimLinks();
      router.push("/links");
      router.refresh();
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await skipClaim();
      router.push("/links");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={handleSkip} disabled={isPending}>
        Skip
      </Button>
      <Button onClick={handleClaim} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Add to my account
      </Button>
    </div>
  );
}
