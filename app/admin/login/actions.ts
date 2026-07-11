"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

export async function signIn(email: string, password: string, next?: string): Promise<SignInResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref")) {
    return { ok: false, error: "No Supabase project connected yet. Set up .env.local first (see README)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }

  redirect(next && next.startsWith("/admin") ? next : "/admin/operations");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
