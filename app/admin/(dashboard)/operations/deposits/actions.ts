"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { getAccountBalancesForClient, getClients } from "@/lib/data/admin";
import { fdInterestEarned } from "@/lib/finance";
import { notifyClient } from "@/lib/sms/notify";
import { smsTemplates } from "@/lib/sms/templates";
import {
  fdBookingSchema,
  fdEarlyWithdrawalRequestSchema,
  fdRolloverRequestSchema,
  savingsTransactionSchema,
  WITHDRAWAL_APPROVAL_THRESHOLD,
  type FdBookingInput,
  type FdEarlyWithdrawalRequestInput,
  type FdRolloverRequestInput,
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

  const { data: account } = await supabase.from("accounts").select("client_id").eq("id", accountId).single();
  if (account?.client_id) {
    const { data: balanceRow } = await supabase.from("account_balances").select("balance").eq("account_id", accountId).single();
    const balance = balanceRow?.balance ?? 0;
    const message = type === "deposit" ? smsTemplates.depositReceived(amount, balance) : smsTemplates.withdrawalProcessed(amount, balance);
    await notifyClient(supabase, account.client_id, type === "deposit" ? "savings_deposit" : "savings_withdrawal", message);
  }
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
  await notifyClient(supabase, data.clientId, "fd_booking", smsTemplates.fdBooked(data.principal, fdNumber));

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}

async function logFdEvent(
  supabase: ReturnType<typeof createAdminClient>,
  fdId: string,
  eventType: string,
  actorId: string,
  amount?: number,
  notes?: string | null
) {
  await supabase.from("fd_events").insert({ fd_id: fdId, event_type: eventType, actor_id: actorId, amount: amount ?? null, notes: notes ?? null });
}

async function assertNoPendingFdRequest(supabase: ReturnType<typeof createAdminClient>, fdId: string) {
  const { data } = await supabase
    .from("approvals")
    .select("id")
    .eq("entity_type", "fixed_deposit")
    .eq("entity_id", fdId)
    .eq("status", "pending")
    .maybeSingle();
  return !data;
}

export async function payOutMaturedFd(fdId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (session.profile.role === "agent") return { ok: false, error: "Only managers and admins can pay out fixed deposits." };

  const supabase = createAdminClient();
  const { data: fd } = await supabase.from("fixed_deposits").select("*").eq("id", fdId).single();
  if (!fd) return { ok: false, error: "Fixed deposit not found." };
  if (fd.status !== "matured") return { ok: false, error: "Only matured fixed deposits can be paid out." };

  const interest = fdInterestEarned(fd.principal, fd.annual_rate, fd.term_months);
  const total = fd.principal + interest;

  const { error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "Fixed deposit maturity payout",
    p_reference_type: "fd_maturity_payout",
    p_reference_id: fdId,
    p_legs: [
      { gl_code: "FD_LIAB", debit: fd.principal, fixed_deposit_id: fdId },
      { gl_code: "INT_EXP", debit: interest, fixed_deposit_id: fdId, flow_category: "fd_interest_expense" },
      { gl_code: "BANK", credit: total },
    ],
    p_created_by: session.userId,
  });
  if (postError) {
    console.error("Failed to post FD maturity payout:", postError);
    return { ok: false, error: "Could not post the payout." };
  }

  await supabase.from("fixed_deposits").update({ status: "withdrawn" }).eq("id", fdId);
  await logFdEvent(supabase, fdId, "matured_paid_out", session.userId, total);
  await notifyClient(supabase, fd.client_id, "fd_maturity_payout", smsTemplates.fdMaturityPaidOut(total, fd.fd_number));

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}

export async function requestFdEarlyWithdrawal(input: FdEarlyWithdrawalRequestInput): Promise<ActionResult> {
  const parsed = fdEarlyWithdrawalRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: fd } = await supabase.from("fixed_deposits").select("*").eq("id", data.fdId).single();
  if (!fd) return { ok: false, error: "Fixed deposit not found." };
  if (fd.status !== "active") return { ok: false, error: "Only active fixed deposits can request an early withdrawal." };
  if (!(await assertNoPendingFdRequest(supabase, data.fdId))) {
    return { ok: false, error: "There is already a pending request for this fixed deposit." };
  }

  const { error } = await supabase.from("approvals").insert({
    entity_type: "fixed_deposit",
    entity_id: data.fdId,
    action: "early_withdrawal",
    amount: fd.principal,
    requested_by: session.userId,
    status: "pending",
    notes: data.notes ?? null,
  });
  if (error) return { ok: false, error: "Could not submit the request." };

  await logFdEvent(supabase, data.fdId, "early_withdrawal_requested", session.userId, fd.principal, data.notes);

  revalidatePath("/admin/operations/deposits");
  return { ok: true, pendingApproval: true };
}

export async function approveFdEarlyWithdrawal(approvalId: string, approve: boolean, reason?: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (session.profile.role === "agent") return { ok: false, error: "Only managers and admins can resolve fixed deposit requests." };

  const supabase = createAdminClient();
  const { data: approval } = await supabase.from("approvals").select("*").eq("id", approvalId).single();
  if (!approval || approval.status !== "pending" || approval.entity_type !== "fixed_deposit" || approval.action !== "early_withdrawal") {
    return { ok: false, error: "Request not found or already resolved." };
  }
  const fdId = approval.entity_id;

  if (approve) {
    const { data: fd } = await supabase.from("fixed_deposits").select("*").eq("id", fdId).single();
    if (!fd) return { ok: false, error: "Fixed deposit not found." };

    const { error: postError } = await supabase.rpc("post_ledger_transaction", {
      p_description: "Fixed deposit early withdrawal (interest forfeited)",
      p_reference_type: "fd_early_withdrawal",
      p_reference_id: fdId,
      p_legs: [
        { gl_code: "FD_LIAB", debit: fd.principal, fixed_deposit_id: fdId },
        { gl_code: "BANK", credit: fd.principal },
      ],
      p_created_by: session.userId,
    });
    if (postError) {
      console.error("Failed to post FD early withdrawal:", postError);
      return { ok: false, error: "Could not post the withdrawal." };
    }

    await supabase.from("fixed_deposits").update({ status: "terminated_early" }).eq("id", fdId);
    await logFdEvent(supabase, fdId, "early_withdrawal_approved", session.userId, fd.principal);
    await notifyClient(supabase, fd.client_id, "fd_early_withdrawal", smsTemplates.fdEarlyWithdrawalPaid(fd.principal, fd.fd_number));
  } else {
    await logFdEvent(supabase, fdId, "early_withdrawal_rejected", session.userId, undefined, reason);
  }

  await supabase
    .from("approvals")
    .update({ status: approve ? "approved" : "rejected", approved_by: session.userId, approved_at: new Date().toISOString() })
    .eq("id", approvalId);

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}

export async function requestFdRollover(input: FdRolloverRequestInput): Promise<ActionResult> {
  const parsed = fdRolloverRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: fd } = await supabase.from("fixed_deposits").select("*").eq("id", data.fdId).single();
  if (!fd) return { ok: false, error: "Fixed deposit not found." };
  if (fd.status !== "active" && fd.status !== "matured") {
    return { ok: false, error: "Only active or matured fixed deposits can be rolled over." };
  }
  if (!(await assertNoPendingFdRequest(supabase, data.fdId))) {
    return { ok: false, error: "There is already a pending request for this fixed deposit." };
  }

  const rolloverMeta = JSON.stringify({ newTermMonths: data.newTermMonths, interestDisposition: data.interestDisposition });

  const { error } = await supabase.from("approvals").insert({
    entity_type: "fixed_deposit",
    entity_id: data.fdId,
    action: "rollover",
    amount: fd.principal,
    requested_by: session.userId,
    status: "pending",
    notes: rolloverMeta,
  });
  if (error) return { ok: false, error: "Could not submit the request." };

  await logFdEvent(
    supabase,
    data.fdId,
    "rollover_requested",
    session.userId,
    fd.principal,
    `New term ${data.newTermMonths} months, interest ${data.interestDisposition}`
  );

  revalidatePath("/admin/operations/deposits");
  return { ok: true, pendingApproval: true };
}

export async function approveFdRollover(approvalId: string, approve: boolean, reason?: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (session.profile.role === "agent") return { ok: false, error: "Only managers and admins can resolve fixed deposit requests." };

  const supabase = createAdminClient();
  const { data: approval } = await supabase.from("approvals").select("*").eq("id", approvalId).single();
  if (!approval || approval.status !== "pending" || approval.entity_type !== "fixed_deposit" || approval.action !== "rollover") {
    return { ok: false, error: "Request not found or already resolved." };
  }
  const fdId = approval.entity_id;

  if (approve) {
    const { data: fd } = await supabase.from("fixed_deposits").select("*").eq("id", fdId).single();
    if (!fd) return { ok: false, error: "Fixed deposit not found." };

    let newTermMonths = fd.term_months;
    let interestDisposition: "cash" | "capitalize" = "capitalize";
    try {
      const meta = JSON.parse(approval.notes ?? "{}");
      if (meta.newTermMonths) newTermMonths = meta.newTermMonths;
      if (meta.interestDisposition) interestDisposition = meta.interestDisposition;
    } catch {
      // fall back to defaults above
    }

    const interest = fdInterestEarned(fd.principal, fd.annual_rate, fd.term_months);
    const newPrincipal = interestDisposition === "capitalize" ? fd.principal + interest : fd.principal;

    const { data: rateConfig } = await supabase.from("product_config").select("value").eq("key", "fd_rates").single();
    const rates = (rateConfig?.value as { term_months: number; annual_rate: number }[]) ?? [];
    const newRate = rates.find((r) => r.term_months === newTermMonths)?.annual_rate ?? fd.annual_rate;

    const { count } = await supabase.from("fixed_deposits").select("id", { count: "exact", head: true });
    const newFdNumber = `FD-${String((count ?? 0) + 1).padStart(4, "0")}`;
    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + newTermMonths);

    const { data: newFd, error: insertError } = await supabase
      .from("fixed_deposits")
      .insert({
        client_id: fd.client_id,
        fd_number: newFdNumber,
        principal: newPrincipal,
        annual_rate: newRate,
        term_months: newTermMonths,
        start_date: startDate.toISOString().slice(0, 10),
        maturity_date: maturityDate.toISOString().slice(0, 10),
        rolled_from_fd_id: fdId,
      })
      .select("id")
      .single();
    if (insertError || !newFd) return { ok: false, error: "Could not create the rolled-over fixed deposit." };

    const legs =
      interestDisposition === "capitalize"
        ? [
            { gl_code: "FD_LIAB", debit: fd.principal, fixed_deposit_id: fdId },
            { gl_code: "INT_EXP", debit: interest, fixed_deposit_id: fdId, flow_category: "fd_interest_expense" },
            { gl_code: "FD_LIAB", credit: newPrincipal, fixed_deposit_id: newFd.id },
          ]
        : [
            { gl_code: "FD_LIAB", debit: fd.principal, fixed_deposit_id: fdId },
            { gl_code: "INT_EXP", debit: interest, fixed_deposit_id: fdId, flow_category: "fd_interest_expense" },
            { gl_code: "BANK", credit: interest },
            { gl_code: "FD_LIAB", credit: newPrincipal, fixed_deposit_id: newFd.id },
          ];

    const { data: txnId, error: postError } = await supabase.rpc("post_ledger_transaction", {
      p_description: "Fixed deposit rollover",
      p_reference_type: "fd_rollover",
      p_reference_id: newFd.id,
      p_legs: legs,
      p_created_by: session.userId,
    });
    if (postError) {
      console.error("Failed to post FD rollover:", postError);
      return { ok: false, error: "Could not post the rollover." };
    }

    await supabase.from("fixed_deposits").update({ ledger_transaction_id: txnId }).eq("id", newFd.id);
    await supabase.from("fixed_deposits").update({ status: "rolled_over", rolled_into_fd_id: newFd.id }).eq("id", fdId);
    await logFdEvent(supabase, fdId, "rollover_completed", session.userId, newPrincipal, `Rolled into ${newFdNumber}`);
    await notifyClient(supabase, fd.client_id, "fd_rollover", smsTemplates.fdRolledOver(newPrincipal, fd.fd_number, newFdNumber));
  } else {
    await logFdEvent(supabase, fdId, "rollover_rejected", session.userId, undefined, reason);
  }

  await supabase
    .from("approvals")
    .update({ status: approve ? "approved" : "rejected", approved_by: session.userId, approved_at: new Date().toISOString() })
    .eq("id", approvalId);

  revalidatePath("/admin/operations/deposits");
  return { ok: true };
}
