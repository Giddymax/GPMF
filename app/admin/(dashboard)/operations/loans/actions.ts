"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";
import { getAvgMonthlySavingsInflow, getInstitutionTotals } from "@/lib/data/admin";
import { notifyClient } from "@/lib/sms/notify";
import { smsTemplates } from "@/lib/sms/templates";
import {
  canDisburse,
  groupDisbursementGate,
  installment,
  isEligibleForIndividualLoan,
  numPeriods,
  penalty as calcPenalty,
  processingFee,
  totalRepayable,
  type GroupMemberStatus,
} from "@/lib/finance";
import { newLoanSchema, type NewLoanInput } from "@/lib/validation/loan";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function getLoanPricing(supabase: ReturnType<typeof createAdminClient>) {
  const { data } = await supabase
    .from("product_config")
    .select("key, value")
    .in("key", ["loan_monthly_flat_rate"]);
  const rate = Number((data?.find((d) => d.key === "loan_monthly_flat_rate")?.value as { rate?: number })?.rate ?? 0.045);
  return rate;
}

export async function createLoanApplication(input: NewLoanInput): Promise<ActionResult> {
  const parsed = newLoanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form for errors." };
  const data = parsed.data;

  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const rate = await getLoanPricing(supabase);

  const { count } = await supabase.from("loans").select("id", { count: "exact", head: true });
  const loanNumber = `LN-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { error } = await supabase.from("loans").insert({
    loan_number: loanNumber,
    loan_type: "individual",
    client_id: data.clientId,
    principal: data.principal,
    monthly_flat_rate: rate,
    term_months: data.termMonths,
    frequency: data.frequency,
    processing_fee: processingFee(data.principal),
    status: "pending",
  });
  if (error) return { ok: false, error: "Could not create the loan application." };

  revalidatePath("/admin/operations/loans");
  return { ok: true };
}

export async function appraiseLoan(loanId: string): Promise<{ ok: boolean; eligible?: boolean; reason?: string; maxPrincipal?: number }> {
  const supabase = createAdminClient();
  const { data: loan } = await supabase.from("loans").select("*").eq("id", loanId).single();
  if (!loan || !loan.client_id) return { ok: false };

  const { data: cycles } = await supabase
    .from("susu_cycles")
    .select("id, status, accounts!inner(client_id)")
    .eq("accounts.client_id", loan.client_id)
    .in("status", ["completed", "paid_out", "rolled_over"]);

  const { data: savingsAccount } = await supabase
    .from("accounts")
    .select("opened_at")
    .eq("client_id", loan.client_id)
    .eq("account_type", "savings")
    .single();

  const monthsOfSavingsHistory = savingsAccount
    ? Math.floor((Date.now() - new Date(savingsAccount.opened_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  const avgInflow = await getAvgMonthlySavingsInflow(loan.client_id);

  const result = isEligibleForIndividualLoan({
    completedSusuCycles: cycles?.length ?? 0,
    monthsOfSavingsHistory,
    avgMonthlySavingsInflow: avgInflow,
    requestedPrincipal: loan.principal,
  });

  await supabase.from("loans").update({ status: "appraisal" }).eq("id", loanId).eq("status", "pending");
  revalidatePath("/admin/operations/loans");

  return { ok: true, eligible: result.eligible, reason: result.reason, maxPrincipal: result.maxPrincipal };
}

export async function approveLoan(loanId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };
  if (session.profile.role === "agent") return { ok: false, error: "Only managers and admins can approve loans." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("loans")
    .update({ status: "approved", approved_by: session.userId, approved_at: new Date().toISOString() })
    .eq("id", loanId);
  if (error) return { ok: false, error: "Could not approve the loan." };

  revalidatePath("/admin/operations/loans");
  return { ok: true };
}

export async function rejectLoan(loanId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  await supabase.from("loans").update({ status: "rejected" }).eq("id", loanId);
  revalidatePath("/admin/operations/loans");
  return { ok: true };
}

export async function disburseLoan(loanId: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: loan } = await supabase.from("loans").select("*").eq("id", loanId).single();
  if (!loan) return { ok: false, error: "Loan not found." };
  if (loan.status !== "approved") return { ok: false, error: "Loan must be approved before disbursement." };

  const totals = await getInstitutionTotals();
  const guardrail = canDisburse(loan.principal, totals.liquid_assets, totals.gross_loan_portfolio, totals.total_deposits);
  if (!guardrail.ok) {
    return { ok: false, error: guardrail.message || "Disbursement blocked by a guardrail." };
  }

  let agentId: string | null = null;
  if (loan.client_id) {
    const { data: client } = await supabase.from("clients").select("agent_id").eq("id", loan.client_id).single();
    agentId = client?.agent_id ?? null;
  } else if (loan.group_id) {
    const { data: group } = await supabase.from("groups").select("agent_id").eq("id", loan.group_id).single();
    agentId = group?.agent_id ?? null;
  }

  const legs: Record<string, unknown>[] = [
    { gl_code: "LOAN_PORTFOLIO", debit: loan.principal, loan_id: loanId, group_id: loan.group_id },
    { gl_code: "CASH_HAND", credit: loan.principal, agent_id: agentId },
  ];

  const { data: txnId, error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "Loan disbursement",
    p_reference_type: "loan_disbursement",
    p_reference_id: loanId,
    p_legs: legs,
    p_created_by: session.userId,
  });
  if (postError) {
    console.error("Failed to post loan disbursement:", postError);
    return { ok: false, error: "Could not post the disbursement." };
  }

  const total = totalRepayable(loan.principal, loan.monthly_flat_rate, loan.term_months);
  const periods = numPeriods(loan.term_months, loan.frequency);
  const perInstallment = installment(loan.principal, loan.monthly_flat_rate, loan.term_months, loan.frequency);
  const principalPerInstallment = (perInstallment * loan.principal) / total;
  const interestPerInstallment = perInstallment - principalPerInstallment;

  const stepDays = loan.frequency === "daily" ? 1 : loan.frequency === "weekly" ? 7 : 30;
  const schedules = Array.from({ length: periods }, (_, i) => {
    const due = new Date();
    due.setDate(due.getDate() + stepDays * (i + 1));
    return {
      loan_id: loanId,
      period_number: i + 1,
      due_date: due.toISOString().slice(0, 10),
      principal_due: Number(principalPerInstallment.toFixed(2)),
      interest_due: Number(interestPerInstallment.toFixed(2)),
      total_due: Number(perInstallment.toFixed(2)),
    };
  });
  await supabase.from("loan_schedules").insert(schedules);

  await supabase
    .from("loans")
    .update({ status: "disbursed", disbursed_by: session.userId, disbursed_at: new Date().toISOString(), ledger_transaction_id: txnId })
    .eq("id", loanId);

  if (loan.client_id) {
    await notifyClient(supabase, loan.client_id, "loan_disbursement", smsTemplates.loanDisbursed(loan.principal, loan.loan_number));
  }

  revalidatePath("/admin/operations/loans");
  return { ok: true };
}

export async function recordRepayment(loanId: string, scheduleId: string, amount: number): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: loan } = await supabase.from("loans").select("*").eq("id", loanId).single();
  const { data: schedule } = await supabase.from("loan_schedules").select("*").eq("id", scheduleId).single();
  if (!loan || !schedule) return { ok: false, error: "Loan or schedule not found." };

  const daysLate = Math.max(0, Math.floor((Date.now() - new Date(schedule.due_date).getTime()) / (1000 * 60 * 60 * 24)));
  const penaltyAmount = daysLate > 0 ? calcPenalty(schedule.total_due, daysLate, schedule.total_due) : 0;

  let agentId: string | null = null;
  if (loan.client_id) {
    const { data: client } = await supabase.from("clients").select("agent_id").eq("id", loan.client_id).single();
    agentId = client?.agent_id ?? null;
  }

  const principalPortion = Math.min(amount, schedule.principal_due);
  const interestPortion = Math.max(0, amount - principalPortion);

  const { data: txnId, error: postError } = await supabase.rpc("post_ledger_transaction", {
    p_description: "Loan repayment",
    p_reference_type: "loan_repayment",
    p_reference_id: loanId,
    p_legs: [
      { gl_code: "CASH_HAND", debit: amount + penaltyAmount, agent_id: agentId },
      { gl_code: "LOAN_PORTFOLIO", credit: principalPortion, loan_id: loanId },
      { gl_code: "INT_INCOME", credit: interestPortion + penaltyAmount, flow_category: "loan_interest" },
    ],
    p_created_by: session.userId,
  });
  if (postError) {
    console.error("Failed to post loan repayment:", postError);
    return { ok: false, error: "Could not post the repayment." };
  }

  await supabase.from("loan_repayments").insert({
    loan_id: loanId,
    schedule_id: scheduleId,
    amount,
    penalty: penaltyAmount,
    collected_by: agentId,
    ledger_transaction_id: txnId,
  });

  const newStatus = amount >= schedule.total_due ? "paid" : "partial";
  await supabase.from("loan_schedules").update({ status: newStatus }).eq("id", scheduleId);

  if (loan.client_id) {
    await notifyClient(supabase, loan.client_id, "loan_repayment", smsTemplates.loanRepaymentReceived(amount, loan.loan_number));
  }

  revalidatePath("/admin/operations/loans");
  return { ok: true };
}

export async function addArrearsNote(loanId: string, note: string): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  await supabase.from("audit_log").insert({
    actor_id: session.userId,
    action: "loan.arrears_followup",
    entity_type: "loans",
    entity_id: loanId,
    diff: { note },
  });

  revalidatePath("/admin/operations/loans");
  return { ok: true };
}

export async function disburseGroupTranche(groupId: string, principalPerMember: number, termMonths: number): Promise<ActionResult> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "Session expired." };

  const supabase = createAdminClient();
  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("tranche_index");
  if (!members || members.length !== 5) return { ok: false, error: "Group must have exactly 5 members." };

  const gate = groupDisbursementGate(members.map((m) => m.status as GroupMemberStatus));
  if (gate.blocked || gate.activeTrancheIndex === null) {
    return { ok: false, error: gate.reason || "This tranche is not eligible for disbursement." };
  }

  const pendingMembers = members.filter((m) => m.tranche_index === gate.activeTrancheIndex && m.status === "pending");
  if (pendingMembers.length === 0) return { ok: false, error: "No pending members in the active tranche." };

  const rate = await getLoanPricing(supabase);
  const { data: group } = await supabase.from("groups").select("agent_id").eq("id", groupId).single();

  const { count } = await supabase.from("loans").select("id", { count: "exact", head: true });
  let seq = (count ?? 0) + 1;

  for (const member of pendingMembers) {
    const loanNumber = `GLN-${String(seq).padStart(4, "0")}`;
    seq += 1;
    const { data: loan, error } = await supabase
      .from("loans")
      .insert({
        loan_number: loanNumber,
        loan_type: "individual",
        client_id: member.client_id,
        group_id: groupId,
        principal: principalPerMember,
        monthly_flat_rate: rate,
        term_months: termMonths,
        frequency: "weekly",
        processing_fee: processingFee(principalPerMember),
        status: "disbursed",
        disbursed_by: session.userId,
        disbursed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !loan) continue;

    await supabase.rpc("post_ledger_transaction", {
      p_description: "Group loan disbursement",
      p_reference_type: "loan_disbursement",
      p_reference_id: loan.id,
      p_legs: [
        { gl_code: "LOAN_PORTFOLIO", debit: principalPerMember, loan_id: loan.id, group_id: groupId },
        { gl_code: "CASH_HAND", credit: principalPerMember, agent_id: group?.agent_id ?? null },
      ],
      p_created_by: session.userId,
    });

    if (member.client_id) {
      await notifyClient(supabase, member.client_id, "loan_disbursement", smsTemplates.loanDisbursed(principalPerMember, loanNumber));
    }

    await supabase.from("group_members").update({ status: "current" }).eq("id", member.id);
  }

  revalidatePath("/admin/operations/loans/groups");
  return { ok: true };
}
