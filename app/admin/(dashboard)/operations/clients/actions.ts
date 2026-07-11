"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getStaffSession } from "@/lib/auth/session";
import { newClientSchema, type NewClientInput } from "@/lib/validation/client";

export interface CreateClientResult {
  ok: boolean;
  clientId?: string;
  error?: string;
}

async function nextClientCode(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count } = await supabase.from("clients").select("id", { count: "exact", head: true });
  const seq = (count ?? 0) + 1;
  return `GPFS-${String(seq).padStart(4, "0")}`;
}

export async function createNewClient(input: NewClientInput): Promise<CreateClientResult> {
  const parsed = newClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };

  const supabase = await createClient();
  const clientCode = await nextClientCode(supabase);

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      client_code: clientCode,
      full_name: data.fullName,
      phone: data.phone,
      ghana_card_no: data.ghanaCardNo || null,
      town: data.town,
      agent_id: data.agentId || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !client) {
    console.error("Failed to create client:", error);
    return { ok: false, error: "Could not create the client record." };
  }

  const { error: accountsError } = await supabase.from("accounts").insert([
    { client_id: client.id, account_type: "savings", account_number: `SAV-${clientCode.split("-")[1]}` },
    { client_id: client.id, account_type: "susu", account_number: `SUS-${clientCode.split("-")[1]}` },
  ]);
  if (accountsError) {
    console.error("Failed to open default accounts:", accountsError);
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "client.create",
    entity_type: "clients",
    entity_id: client.id,
    diff: { client_code: clientCode, full_name: data.fullName },
  });

  revalidatePath("/admin/operations/clients");
  return { ok: true, clientId: client.id };
}
