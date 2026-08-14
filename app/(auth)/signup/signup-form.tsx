"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MailCheck } from "lucide-react";
import { signUpWithPassword, signInWithGoogle } from "../actions";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signUpWithPassword(email, password);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
        <MailCheck className="size-8 text-accent" />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to {email}. Click it to finish setting up your account.
        </p>
      </div>
    );
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
          minLength={6}
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Sign up
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
        Already have an account? <Link href="/login" className="text-accent hover:underline">Log in</Link>
      </p>
    </div>
  );
}
