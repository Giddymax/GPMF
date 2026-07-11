import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses Row Level Security entirely — never import
 * this from a client component. Reserved for server actions that must post
 * ledger transactions, send staff notifications, or otherwise act with full
 * trust (the maker-checker / guardrail checks happen in the server action
 * itself before this client is used, not in RLS policies).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
