import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export interface StaffSession {
  userId: string;
  email: string | null;
  profile: Profile;
}

/** Returns null if unauthenticated or no matching profile — callers redirect to /admin/login. */
export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return null;

  return { userId: user.id, email: user.email ?? null, profile: profile as Profile };
}

export function canAccess(role: Profile["role"], allowed: Profile["role"][]) {
  return allowed.includes(role);
}
