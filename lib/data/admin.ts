import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data/public";
import type {
  AccountBalanceRow,
  Agent,
  Application,
  Approval,
  CashSession,
  Client,
  Faq,
  FixedDeposit,
  GlTrialBalanceRow,
  Group,
  GroupMember,
  Inquiry,
  Loan,
  LoanBalanceRow,
  LoanParBucketRow,
  LoanSchedule,
  Post,
  ProductConfig,
  Rate,
  RatioHistoryRow,
  SiteStat,
  TeamMember,
  Testimonial,
  TreasuryPlacement,
} from "@/lib/supabase/types";

async function query<T>(fn: () => Promise<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { data, error } = await fn();
    if (error) throw error;
    return (data ?? fallback) as T;
  } catch (err) {
    console.error("Admin data query failed:", err);
    return fallback;
  }
}

export interface LedgerTransactionRow {
  id: string;
  entry_date: string;
  description: string;
  reference_type: string;
  reference_id: string | null;
  reverses_transaction_id: string | null;
  created_at: string;
  total_amount: number;
  is_reversed: boolean;
}

export async function getLedgerTransactions(limit = 100): Promise<LedgerTransactionRow[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];
  try {
    const { data: transactions, error } = await supabase
      .from("ledger_transactions")
      .select("id, entry_date, description, reference_type, reference_id, reverses_transaction_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!transactions || transactions.length === 0) return [];

    const ids = transactions.map((t) => t.id);
    const { data: entries } = await supabase
      .from("ledger_entries")
      .select("transaction_id, debit")
      .in("transaction_id", ids);

    const totalByTxn = new Map<string, number>();
    for (const e of entries ?? []) {
      totalByTxn.set(e.transaction_id, (totalByTxn.get(e.transaction_id) ?? 0) + Number(e.debit));
    }

    const reversedIds = new Set(
      transactions.map((t) => t.reverses_transaction_id).filter((id): id is string => Boolean(id))
    );

    return transactions.map((t) => ({
      ...t,
      total_amount: totalByTxn.get(t.id) ?? 0,
      is_reversed: reversedIds.has(t.id),
    }));
  } catch (err) {
    console.error("Failed to load ledger transactions:", err);
    return [];
  }
}

export interface LedgerEntryLegRow {
  id: string;
  gl_account_id: string;
  gl_code: string;
  gl_name: string;
  debit: number;
  credit: number;
}

/** Fetches every leg for a set of transactions in one query, grouped by transaction_id. */
export async function getLedgerEntriesForTransactions(
  transactionIds: string[]
): Promise<Record<string, LedgerEntryLegRow[]>> {
  const supabase = await createClient();
  if (!isSupabaseConfigured() || transactionIds.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("id, transaction_id, gl_account_id, debit, credit, gl_accounts(code, name)")
      .in("transaction_id", transactionIds)
      .order("created_at");
    if (error) throw error;

    const grouped: Record<string, LedgerEntryLegRow[]> = {};
    for (const row of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gl = (row as any).gl_accounts;
      const leg: LedgerEntryLegRow = {
        id: row.id,
        gl_account_id: row.gl_account_id,
        gl_code: gl?.code ?? "—",
        gl_name: gl?.name ?? "—",
        debit: row.debit,
        credit: row.credit,
      };
      (grouped[row.transaction_id] ??= []).push(leg);
    }
    return grouped;
  } catch (err) {
    console.error("Failed to load ledger entry legs:", err);
    return {};
  }
}

export async function getGlTrialBalance(): Promise<GlTrialBalanceRow[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("gl_trial_balance").select("*").order("code"), []);
}

export async function getInstitutionTotals() {
  const supabase = await createClient();
  return query(
    async () => {
      const res = await supabase.from("institution_totals").select("*").maybeSingle();
      return res;
    },
    {
      liquid_assets: 0,
      gross_loan_portfolio: 0,
      total_deposits: 0,
      group_collateral: 0,
      loan_loss_reserve: 0,
      total_assets: 0,
      total_liabilities: 0,
      total_equity: 0,
    }
  );
}

export async function getRatioHistory(limit = 12): Promise<RatioHistoryRow[]> {
  const supabase = await createClient();
  return query(
    async () => supabase.from("ratio_history").select("*").order("snapshot_date", { ascending: false }).limit(limit),
    []
  );
}

export async function getLoanParBuckets(): Promise<LoanParBucketRow[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("loan_par_buckets").select("*"), []);
}

export interface ArrearsRow extends LoanParBucketRow {
  loan_number: string;
  party_name: string;
}

export async function getArrearsQueue(): Promise<ArrearsRow[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];
  try {
    const { data: buckets, error } = await supabase.from("loan_par_buckets").select("*").gt("days_past_due", 0);
    if (error) throw error;
    if (!buckets || buckets.length === 0) return [];

    const loanIds = buckets.map((b) => b.loan_id);
    const { data: loans } = await supabase
      .from("loans")
      .select("id, loan_number, clients(full_name), groups(name)")
      .in("id", loanIds);

    const loanById = new Map((loans ?? []).map((l) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ll = l as any;
      return [l.id, { loan_number: ll.loan_number, party_name: ll.clients?.full_name ?? ll.groups?.name ?? "—" }];
    }));

    return buckets
      .map((b) => ({ ...b, ...(loanById.get(b.loan_id) ?? { loan_number: "—", party_name: "—" }) }))
      .sort((a, b) => b.days_past_due - a.days_past_due);
  } catch (err) {
    console.error("Failed to load arrears queue:", err);
    return [];
  }
}

export async function getLoanBalances(): Promise<LoanBalanceRow[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("loan_balances").select("*"), []);
}

/** Outstanding loan schedule installments — the asset side of the ALM maturity ladder. */
export async function getPendingLoanSchedules(): Promise<{ due_date: string; total_due: number }[]> {
  const supabase = await createClient();
  return query(
    async () => supabase.from("loan_schedules").select("due_date, total_due").in("status", ["pending", "partial", "overdue"]),
    []
  );
}

/** Active fixed deposit maturities — the liability side of the ALM maturity ladder. */
export async function getActiveFixedDepositMaturities(): Promise<{ maturity_date: string; principal: number }[]> {
  const supabase = await createClient();
  return query(
    async () => supabase.from("fixed_deposits").select("maturity_date, principal").eq("status", "active"),
    []
  );
}

export async function getClients(limit = 100, search?: string): Promise<Client[]> {
  const supabase = await createClient();
  return query(async () => {
    let q = supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(limit);
    if (search) {
      q = q.or(`full_name.ilike.%${search}%,client_code.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    return q;
  }, []);
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient();
  return query(async () => supabase.from("clients").select("*").eq("id", id).maybeSingle(), null);
}

export async function getAccountBalancesForClient(clientId: string): Promise<AccountBalanceRow[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("account_balances").select("*").eq("client_id", clientId), []);
}

export async function getActiveSusuCycleForClient(clientId: string) {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: accounts } = await supabase.from("accounts").select("id").eq("client_id", clientId).eq("account_type", "susu");
    const accountId = accounts?.[0]?.id;
    if (!accountId) return null;
    const { data } = await supabase
      .from("susu_cycles")
      .select("*")
      .eq("account_id", accountId)
      .eq("status", "active")
      .maybeSingle();
    return data;
  } catch (err) {
    console.error("Failed to load active susu cycle:", err);
    return null;
  }
}

export async function getFixedDepositsForClient(clientId: string): Promise<FixedDeposit[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("fixed_deposits").select("*").eq("client_id", clientId), []);
}

export async function getLoansForClient(clientId: string): Promise<Loan[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("loans").select("*").eq("client_id", clientId), []);
}

export interface ClientActivityRow {
  date: string;
  type: "savings" | "susu" | "loan_repayment";
  description: string;
  amount: number;
}

/** Merges the client's savings transactions, susu contributions and loan repayments into one feed. */
export async function getClientActivity(clientId: string): Promise<ClientActivityRow[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];

  try {
    const { data: accounts } = await supabase.from("accounts").select("id, account_type").eq("client_id", clientId);
    const savingsAccountId = accounts?.find((a) => a.account_type === "savings")?.id;
    const susuAccountId = accounts?.find((a) => a.account_type === "susu")?.id;

    const rows: ClientActivityRow[] = [];

    if (savingsAccountId) {
      const { data } = await supabase
        .from("savings_transactions")
        .select("type, amount, created_at")
        .eq("account_id", savingsAccountId)
        .order("created_at", { ascending: false })
        .limit(15);
      for (const t of data ?? []) {
        rows.push({ date: t.created_at, type: "savings", description: `Savings ${t.type}`, amount: t.amount });
      }
    }

    if (susuAccountId) {
      const { data: cycles } = await supabase.from("susu_cycles").select("id, cycle_number").eq("account_id", susuAccountId);
      const cycleIds = (cycles ?? []).map((c) => c.id);
      const cycleNumberById = new Map((cycles ?? []).map((c) => [c.id, c.cycle_number]));
      if (cycleIds.length > 0) {
        const { data } = await supabase
          .from("susu_contributions")
          .select("cycle_id, amount, collected_at")
          .in("cycle_id", cycleIds)
          .order("collected_at", { ascending: false })
          .limit(15);
        for (const c of data ?? []) {
          rows.push({
            date: c.collected_at,
            type: "susu",
            description: `Susu contribution (cycle ${cycleNumberById.get(c.cycle_id) ?? "?"})`,
            amount: c.amount,
          });
        }
      }
    }

    const { data: loans } = await supabase.from("loans").select("id, loan_number").eq("client_id", clientId);
    const loanIds = (loans ?? []).map((l) => l.id);
    const loanNumberById = new Map((loans ?? []).map((l) => [l.id, l.loan_number]));
    if (loanIds.length > 0) {
      const { data } = await supabase
        .from("loan_repayments")
        .select("loan_id, amount, paid_at")
        .in("loan_id", loanIds)
        .order("paid_at", { ascending: false })
        .limit(15);
      for (const r of data ?? []) {
        rows.push({
          date: r.paid_at,
          type: "loan_repayment",
          description: `Loan repayment (${loanNumberById.get(r.loan_id) ?? "?"})`,
          amount: r.amount,
        });
      }
    }

    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  } catch (err) {
    console.error("Failed to load client activity:", err);
    return [];
  }
}

/** Average monthly savings inflow over the last 3 months, feeding the loan eligibility calculation. */
export async function getAvgMonthlySavingsInflow(clientId: string): Promise<number> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return 0;
  try {
    const { data: accounts } = await supabase.from("accounts").select("id").eq("client_id", clientId).eq("account_type", "savings");
    const accountId = accounts?.[0]?.id;
    if (!accountId) return 0;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data } = await supabase
      .from("savings_transactions")
      .select("amount")
      .eq("account_id", accountId)
      .eq("type", "deposit")
      .gte("created_at", threeMonthsAgo.toISOString());

    const total = (data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
    return total / 3;
  } catch (err) {
    console.error("Failed to compute average savings inflow:", err);
    return 0;
  }
}

export interface ClientGroupMembership {
  group: Group;
  member: GroupMember;
}

export async function getClientGroupMembership(clientId: string): Promise<ClientGroupMembership | null> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase
      .from("group_members")
      .select("*, groups(*)")
      .eq("client_id", clientId)
      .maybeSingle();
    if (!data) return null;
    const { groups, ...member } = data as GroupMember & { groups: Group };
    return { group: groups, member: member as GroupMember };
  } catch (err) {
    console.error("Failed to load group membership:", err);
    return null;
  }
}

export async function getAgents(): Promise<Agent[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("agents").select("*").order("employee_code"), []);
}

export async function getGroups(): Promise<Group[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("groups").select("*").order("created_at", { ascending: false }), []);
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("group_members").select("*").eq("group_id", groupId), []);
}

export async function getLoans(status?: string): Promise<Loan[]> {
  const supabase = await createClient();
  return query(async () => {
    let q = supabase.from("loans").select("*").order("applied_at", { ascending: false });
    if (status) q = q.eq("status", status);
    return q;
  }, []);
}

export interface LoanWithParty extends Loan {
  party_name: string;
}

export async function getLoansDetailed(status?: string): Promise<LoanWithParty[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];
  try {
    let q = supabase
      .from("loans")
      .select("*, clients(full_name), groups(name)")
      .order("applied_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((loan) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = loan as any;
      return { ...l, party_name: l.clients?.full_name ?? l.groups?.name ?? "—" };
    });
  } catch (err) {
    console.error("Failed to load loans:", err);
    return [];
  }
}

export interface GroupWithRoster extends Group {
  members: (GroupMember & { client_name: string; client_code: string })[];
  collateral_balance: number;
}

export async function getGroupsWithRoster(): Promise<GroupWithRoster[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];
  try {
    const { data: groups, error } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    if (error) throw error;

    const result: GroupWithRoster[] = [];
    for (const group of groups ?? []) {
      const { data: members } = await supabase
        .from("group_members")
        .select("*, clients(full_name, client_code)")
        .eq("group_id", group.id)
        .order("tranche_index");
      const { data: collateral } = await supabase
        .from("group_collateral_balances")
        .select("collateral_balance")
        .eq("group_id", group.id)
        .maybeSingle();

      result.push({
        ...group,
        collateral_balance: collateral?.collateral_balance ?? 0,
        members: (members ?? []).map((m) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mm = m as any;
          return { ...mm, client_name: mm.clients?.full_name ?? "—", client_code: mm.clients?.client_code ?? "—" };
        }),
      });
    }
    return result;
  } catch (err) {
    console.error("Failed to load groups:", err);
    return [];
  }
}

export async function getLoanSchedules(loanId: string): Promise<LoanSchedule[]> {
  const supabase = await createClient();
  return query(
    async () => supabase.from("loan_schedules").select("*").eq("loan_id", loanId).order("period_number"),
    []
  );
}

export interface AgentCashBalanceRow {
  agent_id: string;
  cash_on_hand: number;
}

export async function getAgentCashBalances(): Promise<AgentCashBalanceRow[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("agent_cash_balances").select("*"), []);
}

export interface SusuCycleWithClient {
  id: string;
  account_id: string;
  cycle_number: number;
  daily_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  client_id: string;
  client_name: string;
  client_code: string;
  agent_id: string | null;
  days_paid: number;
  last_collected_at: string | null;
}

/** Active + completed (not yet paid out) susu cycles, joined with client + collection count, for the collection sheet/cycle board/payout queue. */
export async function getSusuCyclesWithClients(status?: "active" | "completed"): Promise<SusuCycleWithClient[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];
  try {
    let q = supabase
      .from("susu_cycles")
      .select("id, account_id, cycle_number, daily_amount, start_date, end_date, status, accounts(client_id, clients(full_name, client_code, agent_id))")
      .order("start_date", { ascending: false });
    if (status) q = q.eq("status", status);
    else q = q.in("status", ["active", "completed"]);

    const { data, error } = await q;
    if (error) throw error;

    const rows: SusuCycleWithClient[] = [];
    for (const cycle of data ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = (cycle as any).accounts;
      const client = account?.clients;
      if (!client) continue;

      const { data: contributions } = await supabase
        .from("susu_contributions")
        .select("amount, collected_at")
        .eq("cycle_id", cycle.id)
        .order("collected_at", { ascending: false });

      rows.push({
        id: cycle.id,
        account_id: cycle.account_id,
        cycle_number: cycle.cycle_number,
        daily_amount: cycle.daily_amount,
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        status: cycle.status,
        client_id: account.client_id,
        client_name: client.full_name,
        client_code: client.client_code,
        agent_id: client.agent_id,
        days_paid: contributions?.length ?? 0,
        last_collected_at: contributions?.[0]?.collected_at ?? null,
      });
    }
    return rows;
  } catch (err) {
    console.error("Failed to load susu cycles:", err);
    return [];
  }
}

export async function getCashSessions(limit = 50): Promise<CashSession[]> {
  const supabase = await createClient();
  return query(
    async () => supabase.from("cash_sessions").select("*").order("session_date", { ascending: false }).limit(limit),
    []
  );
}

export async function getPendingApprovals(entityType?: string): Promise<Approval[]> {
  const supabase = await createClient();
  return query(async () => {
    let q = supabase.from("approvals").select("*").eq("status", "pending").order("requested_at", { ascending: false });
    if (entityType) q = q.eq("entity_type", entityType);
    return q;
  }, []);
}

export interface FixedDepositWithClient extends FixedDeposit {
  client_name: string;
  client_code: string;
}

export async function getActiveFixedDepositsWithClient(): Promise<FixedDepositWithClient[]> {
  const supabase = await createClient();
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("fixed_deposits")
      .select("*, clients(full_name, client_code)")
      .eq("status", "active")
      .order("maturity_date");
    if (error) throw error;
    return (data ?? []).map((fd) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = (fd as any).clients;
      return { ...fd, client_name: client?.full_name ?? "—", client_code: client?.client_code ?? "—" };
    });
  } catch (err) {
    console.error("Failed to load fixed deposits:", err);
    return [];
  }
}

export async function getTreasuryPlacements(): Promise<TreasuryPlacement[]> {
  const supabase = await createClient();
  return query(
    async () => supabase.from("treasury_placements").select("*").order("placed_date", { ascending: false }),
    []
  );
}

export async function getProductConfig(): Promise<ProductConfig[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("product_config").select("*").order("key"), []);
}

export async function getApplications(status?: string): Promise<Application[]> {
  const supabase = await createClient();
  return query(async () => {
    let q = supabase.from("applications").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    return q;
  }, []);
}

export async function getInquiries(status?: string): Promise<Inquiry[]> {
  const supabase = await createClient();
  return query(async () => {
    let q = supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    return q;
  }, []);
}

// Content management (admin editors read all rows, not just published ones).
export async function getAllPosts(): Promise<Post[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("posts").select("*").order("created_at", { ascending: false }), []);
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("testimonials").select("*").order("sort_order"), []);
}

export async function getAllFaqs(): Promise<Faq[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("faqs").select("*").order("sort_order"), []);
}

export async function getAllRates(): Promise<Rate[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("rates").select("*").order("sort_order"), []);
}

export async function getAllSiteStats(): Promise<SiteStat[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("site_stats").select("*").order("sort_order"), []);
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  return query(async () => supabase.from("team_members").select("*").order("sort_order"), []);
}
