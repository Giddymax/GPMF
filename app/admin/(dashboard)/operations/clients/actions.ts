"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { newClientSchema, type NewClientInput } from "@/lib/validation/client";

export interface CreateClientResult {
  ok: boolean;
  clientId?: string;
  error?: string;
}

export async function createNewClient(input: NewClientInput): Promise<CreateClientResult> {
  const parsed = newClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };

  const supabase = await createClient();

  // client_code is DB-generated (see next_client_code() / client_code_seq in
  // the migration) — a real sequence, so concurrent registrations can never
  // collide the way a "count existing rows + 1" scheme could.
  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      full_name: data.fullName,
      phone: data.phone,
      sms_opt_in: data.smsOptIn,
      email: data.email || null,
      date_of_birth: data.dateOfBirth || null,
      gender: data.gender || null,
      occupation: data.occupation || null,
      ghana_card_no: data.ghanaCardNo,
      photo_url: data.photoUrl || null,
      town: data.town,
      region: data.region || null,
      area: data.area || null,
      digital_address: data.digitalAddress || null,
      interested_products: data.interestedProducts,
      next_of_kin_name: data.nextOfKinName,
      next_of_kin_relationship: data.nextOfKinRelationship,
      next_of_kin_phone: data.nextOfKinPhone,
      next_of_kin_address: data.nextOfKinAddress || null,
      agent_id: data.agentId || null,
      status: "active",
    })
    .select("id, client_code")
    .single();

  if (error || !client) {
    console.error("Failed to create client:", error);
    if (error?.code === "23505") {
      return { ok: false, error: "A client with this Ghana Card number is already registered." };
    }
    return { ok: false, error: "Could not create the client record." };
  }

  const codeSuffix = client.client_code.split("-")[1];
  const { error: accountsError } = await supabase.from("accounts").insert([
    { client_id: client.id, account_type: "savings", account_number: `SAV-${codeSuffix}` },
    { client_id: client.id, account_type: "susu", account_number: `SUS-${codeSuffix}` },
  ]);
  if (accountsError) {
    console.error("Failed to open default accounts:", accountsError);
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "client.create",
    entity_type: "clients",
    entity_id: client.id,
    diff: { client_code: client.client_code, full_name: data.fullName },
  });

  revalidatePath("/admin/operations/clients");
  return { ok: true, clientId: client.id };
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateClient(clientId: string, input: NewClientInput): Promise<ActionResult> {
  const parsed = newClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: data.fullName,
      phone: data.phone,
      sms_opt_in: data.smsOptIn,
      email: data.email || null,
      date_of_birth: data.dateOfBirth || null,
      gender: data.gender || null,
      occupation: data.occupation || null,
      ghana_card_no: data.ghanaCardNo,
      photo_url: data.photoUrl || null,
      town: data.town,
      region: data.region || null,
      area: data.area || null,
      digital_address: data.digitalAddress || null,
      interested_products: data.interestedProducts,
      next_of_kin_name: data.nextOfKinName,
      next_of_kin_relationship: data.nextOfKinRelationship,
      next_of_kin_phone: data.nextOfKinPhone,
      next_of_kin_address: data.nextOfKinAddress || null,
      agent_id: data.agentId || null,
    })
    .eq("id", clientId);

  if (error) {
    console.error("Failed to update client:", error);
    if (error.code === "23505") {
      return { ok: false, error: "A client with this Ghana Card number is already registered." };
    }
    return { ok: false, error: "Could not update the client record." };
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "client.update",
    entity_type: "clients",
    entity_id: clientId,
    diff: { full_name: data.fullName },
  });

  revalidatePath("/admin/operations/clients");
  revalidatePath(`/admin/operations/clients/${clientId}`);
  return { ok: true };
}

/**
 * Soft delete: a client with real financial history (a balance, an open loan,
 * an active fixed deposit) is never hard-deleted — that would cascade into
 * ledger-linked rows and break the audit trail the whole system is built on.
 * Closing just flips status and hides them from the default active list.
 */
export async function closeClient(clientId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };

  const supabase = await createClient();

  const [{ data: balances }, { data: loans }, { data: fds }] = await Promise.all([
    supabase.from("account_balances").select("account_type, balance").eq("client_id", clientId),
    supabase.from("loans").select("id").eq("client_id", clientId).eq("status", "disbursed"),
    supabase.from("fixed_deposits").select("id").eq("client_id", clientId).eq("status", "active"),
  ]);

  const blockers: string[] = [];
  const nonZeroBalance = (balances ?? []).find((b) => Math.abs(b.balance) > 0.005);
  if (nonZeroBalance) blockers.push(`a non-zero ${nonZeroBalance.account_type} balance`);
  if ((loans ?? []).length > 0) blockers.push("an outstanding loan");
  if ((fds ?? []).length > 0) blockers.push("an active fixed deposit");

  if (blockers.length > 0) {
    return {
      ok: false,
      error: `Can't close this client — they still have ${blockers.join(" and ")}. Settle or transfer these first.`,
    };
  }

  const { error } = await supabase.from("clients").update({ status: "closed" }).eq("id", clientId);
  if (error) {
    console.error("Failed to close client:", error);
    return { ok: false, error: "Could not close the client record." };
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "client.close",
    entity_type: "clients",
    entity_id: clientId,
    diff: { status: "closed" },
  });

  revalidatePath("/admin/operations/clients");
  revalidatePath(`/admin/operations/clients/${clientId}`);
  return { ok: true };
}

/**
 * Hard delete — for cleaning up dummy/demo/mis-entered clients, not real ones.
 * Removes the client and every linked row, including their ledger history
 * (see purge_client() in the migration for why that needs its own function).
 * Restricted to manager/admin; the confirmation UI makes the caller type the
 * client's name before this is ever invoked.
 */
export async function deleteClient(clientId: string, clientName: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (session.profile.role === "agent") {
    return { ok: false, error: "Only managers and admins can permanently delete a client." };
  }

  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "client.delete",
    entity_type: "clients",
    entity_id: clientId,
    diff: { full_name: clientName },
  });

  const admin = createAdminClient();
  const { error } = await admin.rpc("purge_client", { p_client_id: clientId });
  if (error) {
    console.error("Failed to delete client:", error);
    return { ok: false, error: "Could not delete the client record." };
  }

  revalidatePath("/admin/operations/clients");
  return { ok: true };
}
