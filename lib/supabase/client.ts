"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Anon-key client for use in client components. Subject to Row Level Security. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createBrowserClient(url, anonKey);
}
