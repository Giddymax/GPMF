"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { CONTENT_TABLES, type ContentTable } from "@/lib/admin-content-config";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function isContentTable(table: string): table is ContentTable {
  return (CONTENT_TABLES as string[]).includes(table);
}

async function requireManager() {
  const session = await getStaffSession();
  if (!session) return { ok: false as const, error: "Session expired." };
  if (session.profile.role === "agent") return { ok: false as const, error: "Only managers and admins can edit content." };
  return { ok: true as const, session };
}

export async function upsertContentRow(
  table: string,
  id: string | null,
  values: Record<string, unknown>
): Promise<ActionResult> {
  if (!isContentTable(table)) return { ok: false, error: "Unknown content table." };
  const auth = await requireManager();
  if (!auth.ok) return auth;

  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from(table).update(values).eq("id", id)
    : await supabase.from(table).insert(values);

  if (error) {
    console.error(`Failed to save ${table} row:`, error);
    return { ok: false, error: "Could not save. Check required fields." };
  }

  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/news");
  return { ok: true };
}

export async function deleteContentRow(table: string, id: string): Promise<ActionResult> {
  if (!isContentTable(table)) return { ok: false, error: "Unknown content table." };
  const auth = await requireManager();
  if (!auth.ok) return auth;

  const supabase = createAdminClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: "Could not delete." };

  revalidatePath("/admin/content");
  revalidatePath("/");
  return { ok: true };
}

export async function updateProductConfig(id: string, value: unknown): Promise<ActionResult> {
  const auth = await requireManager();
  if (!auth.ok) return auth;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("product_config")
    .update({ value, updated_by: auth.session.userId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "Could not save configuration." };

  revalidatePath("/admin/content");
  return { ok: true };
}
