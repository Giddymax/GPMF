import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Anon-key client for server components / server actions, bound to the current
 * user's session cookie. Subject to Row Level Security — use this for anything
 * scoped to "what can this logged-in staff member see", and lib/supabase/admin.ts
 * for money-moving writes that must bypass RLS (server actions only).
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Placeholders when no project is connected yet, so construction never throws —
  // isSupabaseConfigured() gates real usage before any query actually runs (see lib/data/*).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no request context to mutate —
            // safe to ignore as long as middleware refreshes the session.
          }
        },
      },
    }
  );
}
