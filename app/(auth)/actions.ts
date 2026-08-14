"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ok, err, type Result } from "@/lib/services/types";

export async function signInWithPassword(email: string, password: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return err("FORBIDDEN", error.message);
  return ok(undefined);
}

export async function signUpWithPassword(email: string, password: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return err("VALIDATION_ERROR", error.message);
  return ok(undefined);
}

export async function signInWithGoogle(): Promise<Result<{ url: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error || !data.url) {
    return err("UNKNOWN", error?.message ?? "Could not start Google sign-in.");
  }
  return ok({ url: data.url });
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
