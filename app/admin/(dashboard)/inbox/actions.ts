"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import type { ApplicationStatus, InquiryStatus } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, notes?: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("applications")
    .update({ status, ...(notes !== undefined ? { notes } : {}) })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not update application." };

  revalidatePath("/admin/inbox");
  return { ok: true };
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) return { ok: false, error: "Could not update inquiry." };

  revalidatePath("/admin/inbox");
  return { ok: true };
}
