"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function reverseTransaction(transactionId: string, reason: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (session.profile.role === "agent") {
    return { ok: false, error: "Only managers and admins can reverse a transaction." };
  }
  if (!reason.trim()) {
    return { ok: false, error: "Enter a reason for the reversal." };
  }

  const supabase = createAdminClient();

  // Re-check right before acting — the list the button was clicked from may
  // be stale, and reverse_ledger_transaction() itself doesn't guard against
  // reversing something twice.
  const { data: original } = await supabase
    .from("ledger_transactions")
    .select("id")
    .eq("id", transactionId)
    .single();
  if (!original) return { ok: false, error: "Transaction not found." };

  const { data: existingReversal } = await supabase
    .from("ledger_transactions")
    .select("id")
    .eq("reverses_transaction_id", transactionId)
    .maybeSingle();
  if (existingReversal) {
    return { ok: false, error: "This transaction has already been reversed." };
  }

  const { error } = await supabase.rpc("reverse_ledger_transaction", {
    p_transaction_id: transactionId,
    p_reason: reason.trim(),
    p_created_by: session.userId,
  });

  if (error) {
    console.error("Failed to reverse transaction:", error);
    return { ok: false, error: "Could not reverse the transaction." };
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "ledger.reverse",
    entity_type: "ledger_transactions",
    entity_id: transactionId,
    diff: { reason: reason.trim() },
  });

  revalidatePath("/admin/operations/ledger");
  return { ok: true };
}

export interface LedgerLegEdit {
  id: string;
  debit: number;
  credit: number;
}

/**
 * Raw edit, at the application's explicit request — bypasses the ledger's
 * append-only triggers via admin_update_ledger_transaction/entry() (see the
 * migration). Does not re-check that legs still balance after saving.
 */
export async function updateLedgerTransactionAndLegs(
  transactionId: string,
  description: string,
  entryDate: string,
  legs: LedgerLegEdit[]
): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (session.profile.role === "agent") {
    return { ok: false, error: "Only managers and admins can edit a transaction." };
  }
  if (!description.trim()) return { ok: false, error: "Enter a description." };

  const supabase = createAdminClient();

  const { data: before } = await supabase
    .from("ledger_transactions")
    .select("description, entry_date")
    .eq("id", transactionId)
    .single();
  const { data: legsBefore } = await supabase
    .from("ledger_entries")
    .select("id, debit, credit")
    .eq("transaction_id", transactionId);

  const { error: txnError } = await supabase.rpc("admin_update_ledger_transaction", {
    p_transaction_id: transactionId,
    p_description: description.trim(),
    p_entry_date: entryDate,
  });
  if (txnError) {
    console.error("Failed to update ledger transaction:", txnError);
    return { ok: false, error: "Could not update the transaction." };
  }

  for (const leg of legs) {
    const { error: legError } = await supabase.rpc("admin_update_ledger_entry", {
      p_entry_id: leg.id,
      p_debit: leg.debit,
      p_credit: leg.credit,
    });
    if (legError) {
      console.error("Failed to update ledger entry:", legError);
      return { ok: false, error: `Could not update one of the legs: ${legError.message}` };
    }
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "ledger.edit",
    entity_type: "ledger_transactions",
    entity_id: transactionId,
    diff: { before: { ...before, legs: legsBefore }, after: { description, entry_date: entryDate, legs } },
  });

  revalidatePath("/admin/operations/ledger");
  return { ok: true };
}

/**
 * Raw delete, at the application's explicit request — bypasses the ledger's
 * append-only triggers via admin_delete_ledger_transaction() (see the
 * migration). Removes the transaction and every leg permanently.
 */
export async function deleteLedgerTransaction(transactionId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (session.profile.role === "agent") {
    return { ok: false, error: "Only managers and admins can delete a transaction." };
  }

  const supabase = createAdminClient();

  const { data: before } = await supabase
    .from("ledger_transactions")
    .select("*, ledger_entries(*)")
    .eq("id", transactionId)
    .single();

  const { error } = await supabase.rpc("admin_delete_ledger_transaction", { p_transaction_id: transactionId });
  if (error) {
    console.error("Failed to delete ledger transaction:", error);
    return { ok: false, error: "Could not delete the transaction." };
  }

  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "ledger.delete",
    entity_type: "ledger_transactions",
    entity_id: transactionId,
    diff: { deleted: before },
  });

  revalidatePath("/admin/operations/ledger");
  return { ok: true };
}
