"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { signInWithPassword, signInWithGoogle } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signInWithPassword(email, password);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.push("/claim");
      router.refresh();
    });
  }

  async function handleGoogle() {
    setGooglePending(true);
    const res = await signInWithGoogle();
    if (res.ok) {
      window.location.href = res.data.url;
    } else {
      setError(res.error.message);
      setGooglePending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Log in
        </Button>
      </form>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
      <Button variant="outline" onClick={handleGoogle} disabled={isGooglePending}>
        {isGooglePending && <Loader2 className="animate-spin" />}
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account? <Link href="/signup" className="text-accent hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
