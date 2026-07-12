"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

/**
 * Bound directly to <form action={signIn}> (see LoginForm) rather than
 * invoked from an onSubmit handler, so the browser's native form submission
 * IS the correct POST — this keeps sign-in working via progressive
 * enhancement even if client JS hasn't hydrated yet on a slow mobile
 * connection. A plain onSubmit-intercepted version would fall back to a
 * bare native GET-to-current-URL submission in that race, which reloads the
 * page with credentials in the query string and empty fields — exactly the
 * "input clears with no error" bug this was built to fix.
 */
export async function signIn(prevState: SignInResult | null, formData: FormData): Promise<SignInResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { ok: false, error: "Enter both your email and password." };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref")) {
    return { ok: false, error: "No Supabase project connected yet. Set up .env.local first (see README)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Surface Supabase's actual reason (e.g. "Invalid login credentials",
    // "Email not confirmed") instead of masking it — the generic message
    // makes a wrong password and an unconfirmed email indistinguishable.
    return { ok: false, error: error.message };
  }

  // Auth succeeded, but the admin portal also requires a matching `profiles`
  // row (role, full name). Without one, the dashboard layout would silently
  // bounce back to /admin/login on the next request — which looks exactly
  // like a failed sign-in even though authentication worked. Catch that here
  // with a clear, actionable message instead.
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error:
        "Signed in, but no staff profile exists for this account yet. Ask an admin to add a row to the `profiles` table for this user (id, full_name, role), or run `npm run seed:staff` for the demo accounts.",
    };
  }

  redirect(next && next.startsWith("/admin") ? next : "/admin/operations");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
