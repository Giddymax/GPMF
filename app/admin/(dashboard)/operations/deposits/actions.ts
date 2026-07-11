"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { getAccountBalancesForClient, getClients } from "@/lib/data/admin";
import {
  fdBookingSchema,
  savingsTransactionSchema,
  WITHDRAWAL_APPROVAL_THRESHOLD,
  type FdBookingInput,
  type SavingsTransactionInput,
} from "@/lib/validation/deposit";

export interface ActionResult {
  ok: boolean;
  pendingApproval?: boolean;
  error?: string;
}

export async function searchClients(query: string) {
  if (!query || query.length < 2) return [];
  const clients = await getClients(10, query);
  return clients.map((c) => ({ id: c.id, label: `${c.full_name} (${c.client_code})` }));
}

export async function lookupClientSavingsAccount(clientId: string) {
  const balances = await getAccountBalancesForClient(clientId);
  return balances.find((b) => b.account_type === "savings") ?? null;
}

async function postSavingsLedger(
  supabase: ReturnType<typeof createAdminClient>,
  accountId: string,
  type: "deposit" | "withdrawal",
  amount: number,
  createdBy: string
) {
  const legs =
    type === "deposit"
      ? [
          { gl_code: "BANK", debit: amount },
          { gl_code: "SAVINGS_LIAB", credit: amount, client_account_id: accountId },
        ]
      : [
          { gl_code: "SAVINGS_LIAB", debit: amount, client_account_id: accountId },
          { gl_code: "BANK", credit: amount },
        ];

  const { data: txnId, error } = await supabase.rpc("post_ledger_transaction", {
    p_description: `Savings ${type}`,
    p_reference_type: `savings_${type}`,
    p_reference_id: accountId,
    p_legs: legs,
    p_created_by: createdBy,
  });
  if (error) throw error;

  await supabase.from("savings_transactions").insert({
    account_id: accountId,
    type,
    amount,
    ledger_transaction_id: txnId,
    created_by: createdBy,
  });
}

export async function postSavingsTransaction(input: SavingsTransactionInput): Promise<ActionResult> {
  const parsed = savingsTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();

  if (data.type === "withdrawal" && data.amount > WITHDRAWAL_APPROVAL_THRESHOLD) {
    const { error } = await supabase.from("approvals").insert({
      entity_type: "savings_withdrawal",
      entity_id: data.accountId,
      action: "withdraw",
      amount: data.amount,
      requested_by: session.userId,
      status: "pending",
    });
    if (error) return { ok: false, error: "Could not submit for approval." };
    revalidatePath("/admin/operations/deposits");
    return { ok: true, pendingApproval: true };
  }

  try {
    await postSavingsLedger(supabase, data.accountId, data.type, data.amount, session.userId);
  } catch (err) {
    console.error("Failed to post savings transaction:", err);
    return { ok: false, error: "Could not post the transaction." };
  }

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}

export async function approveWithdrawal(approvalId: string, approve: boolean): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (session.profile.role === "agent") return { ok: false, error: "Only managers and admins can approve withdrawals." };

  const supabase = createAdminClient();
  const { data: approval } = await supabase.from("approvals").select("*").eq("id", approvalId).single();
  if (!approval || approval.status !== "pending") return { ok: false, error: "Approval not found or already resolved." };

  if (approve) {
    try {
      await postSavingsLedger(supabase, approval.entity_id, "withdrawal", approval.amount, session.userId);
    } catch (err) {
      console.error("Failed to post approved withdrawal:", err);
      return { ok: false, error: "Could not post the withdrawal." };
    }
  }

  await supabase
    .from("approvals")
    .update({ status: approve ? "approved" : "rejected", approved_by: session.userId, approved_at: new Date().toISOString() })
    .eq("id", approvalId);

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}

export async function bookFixedDeposit(input: FdBookingInput): Promise<ActionResult> {
  const parsed = fdBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: rateConfig } = await supabase.from("product_config").select("value").eq("key", "fd_rates").single();
  const rates = (rateConfig?.value as { term_months: number; annual_rate: number }[]) ?? [];
  const rate = rates.find((r) => r.term_months === data.termMonths)?.annual_rate ?? 0.1;

  const { count } = await supabase.from("fixed_deposits").select("id", { count: "exact", head: true });
  const fdNumber = `FD-${String((count ?? 0) + 1).padStart(4, "0")}`;
  const startDate = new Date();
  const maturityDate = new Date(startDate);
  maturityDate.setMonth(maturityDate.getMonth() + data.termMonths);

  const { data: fd, error } = await supabase
    .from("fixed_deposits")
    .insert({
      client_id: data.clientId,
      fd_number: fdNumber,
      principal: data.principal,
      annual_rate: rate,
      term_months: data.termMonths,
      start_date: startDate.toISOString().slice(0, 10),
      maturity_date: maturityDate.toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error || !fd) return { ok: false, error: "Could not book the fixed deposit." };

  const { data: txnId, error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "Fixed deposit booking",
    p_reference_type: "fd_booking",
    p_reference_id: fd.id,
    p_legs: [
      { gl_code: "BANK", debit: data.principal },
      { gl_code: "FD_LIAB", credit: data.principal, fixed_deposit_id: fd.id },
    ],
    p_created_by: session.userId,
  });
  if (postError) {
    console.error("Failed to post FD booking:", postError);
    return { ok: false, error: "Deposit created but the ledger post failed — contact support." };
  }

  await supabase.from("fixed_deposits").update({ ledger_transaction_id: txnId }).eq("id", fd.id);

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}
