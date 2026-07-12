"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { cycleCommission, cyclePayout, SUSU_CYCLE_DAYS } from "@/lib/finance";
import { notifyClient } from "@/lib/sms/notify";
import { smsTemplates } from "@/lib/sms/templates";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function recordSusuContribution(cycleId: string, agentId: string, amount: number): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (amount <= 0) return { ok: false, error: "Enter an amount greater than zero." };

  const supabase = createAdminClient();

  const { data: cycle } = await supabase
    .from("susu_cycles")
    .select("account_id, accounts!inner(client_id)")
    .eq("id", cycleId)
    .single();
  if (!cycle) return { ok: false, error: "Cycle not found." };

  const { data: txnId, error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "Susu collection",
    p_reference_type: "susu_contribution",
    p_reference_id: cycleId,
    p_legs: [
      { gl_code: "CASH_HAND", debit: amount, agent_id: agentId },
      { gl_code: "SUSU_LIAB", credit: amount, client_account_id: cycle.account_id },
    ],
    p_created_by: session.userId,
  });
  if (postError) {
    console.error("Failed to post susu contribution:", postError);
    return { ok: false, error: "Could not record the collection." };
  }

  const { error } = await supabase.from("susu_contributions").insert({
    cycle_id: cycleId,
    collected_by: agentId,
    amount,
    ledger_transaction_id: txnId,
  });
  if (error) {
    console.error("Failed to log susu contribution:", error);
    return { ok: false, error: "Ledger posted but the collection log failed — contact support." };
  }

  const clientId = (cycle as unknown as { accounts: { client_id: string } }).accounts?.client_id;
  if (clientId) {
    await notifyClient(supabase, clientId, "susu_contribution", smsTemplates.susuContributionReceived(amount));
  }

  revalidatePath("/admin/operations/susu");
  return { ok: true };
}

export async function processSusuPayout(cycleId: string, agentId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: cycle } = await supabase
    .from("susu_cycles")
    .select("account_id, daily_amount, accounts!inner(client_id)")
    .eq("id", cycleId)
    .single();
  if (!cycle) return { ok: false, error: "Cycle not found." };

  const { count } = await supabase
    .from("susu_contributions")
    .select("id", { count: "exact", head: true })
    .eq("cycle_id", cycleId);
  const daysPaid = count ?? 0;
  const payout = cyclePayout(cycle.daily_amount, daysPaid);
  const commission = cycleCommission(cycle.daily_amount, daysPaid);
  const totalCollected = daysPaid * cycle.daily_amount;

  const { error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "Susu cycle payout",
    p_reference_type: "susu_payout",
    p_reference_id: cycleId,
    p_legs: [
      { gl_code: "SUSU_LIAB", debit: totalCollected, client_account_id: cycle.account_id },
      { gl_code: "CASH_HAND", credit: payout, agent_id: agentId },
      { gl_code: "COMM_INCOME", credit: commission, agent_id: agentId, flow_category: "susu_commission" },
    ],
    p_created_by: session.userId,
  });
  if (postError) {
    console.error("Failed to post susu payout:", postError);
    return { ok: false, error: "Could not process the payout." };
  }

  await supabase.from("susu_cycles").update({ status: "paid_out" }).eq("id", cycleId);

  const clientId = (cycle as unknown as { accounts: { client_id: string } }).accounts?.client_id;
  if (clientId) {
    await notifyClient(supabase, clientId, "susu_payout", smsTemplates.susuPayoutCompleted(payout));
  }

  revalidatePath("/admin/operations/susu");
  return { ok: true };
}

export async function rolloverSusuCycle(cycleId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: cycle } = await supabase
    .from("susu_cycles")
    .select("account_id, cycle_number, daily_amount, end_date")
    .eq("id", cycleId)
    .single();
  if (!cycle) return { ok: false, error: "Cycle not found." };

  const startDate = cycle.end_date;
  const endDate = new Date(new Date(cycle.end_date).getTime() + SUSU_CYCLE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  await supabase.from("susu_cycles").update({ status: "rolled_over" }).eq("id", cycleId);
  const { error } = await supabase.from("susu_cycles").insert({
    account_id: cycle.account_id,
    cycle_number: cycle.cycle_number + 1,
    daily_amount: cycle.daily_amount,
    start_date: startDate,
    end_date: endDate,
    status: "active",
  });
  if (error) {
    console.error("Failed to roll over susu cycle:", error);
    return { ok: false, error: "Could not roll over the cycle." };
  }

  revalidatePath("/admin/operations/susu");
  return { ok: true };
}

export async function reconcileCashSession(agentId: string, declaredCash: number): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("agent_id", agentId)
    .eq("session_date", today)
    .maybeSingle();

  let sessionId = existing?.id;
  if (!sessionId) {
    const { data: created, error } = await supabase
      .from("cash_sessions")
      .insert({ agent_id: agentId, session_date: today })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Could not open today's cash session." };
    sessionId = created.id;
  }

  const { error } = await supabase.rpc("close_cash_session", {
    p_session_id: sessionId,
    p_declared_cash: declaredCash,
    p_closed_by: session.userId,
  });
  if (error) {
    console.error("Failed to reconcile cash session:", error);
    return { ok: false, error: "Could not reconcile the cash session." };
  }

  revalidatePath("/admin/operations/susu");
  return { ok: true };
}
