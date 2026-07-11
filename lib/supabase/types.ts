/**
 * Hand-authored types matching supabase/migrations/*.sql. Once a live project
 * exists, prefer regenerating with:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 * (keep the JSDoc note above if you do, so future edits know the source of truth).
 */

export type StaffRole = "agent" | "manager" | "admin";
export type ClientStatus = "active" | "dormant" | "closed";
export type AccountType = "savings" | "susu";
export type AccountStatus = "active" | "dormant" | "closed";
export type SusuCycleStatus = "active" | "completed" | "paid_out" | "rolled_over";
export type FdStatus = "active" | "matured" | "terminated_early" | "rolled_over";
export type LoanType = "individual" | "group";
export type LoanStatus =
  | "pending"
  | "appraisal"
  | "approved"
  | "disbursed"
  | "closed"
  | "written_off"
  | "rejected";
export type RepaymentFrequency = "daily" | "weekly" | "monthly";
export type ScheduleStatus = "pending" | "paid" | "partial" | "overdue";
export type GroupMemberStatus = "pending" | "current" | "overdue" | "defaulted" | "completed";
export type CashSessionStatus = "open" | "closed" | "reconciled";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApplicationStatus = "new" | "contacted" | "opened" | "rejected";
export type InquiryStatus = "new" | "contacted" | "resolved";

export interface Profile {
  id: string;
  full_name: string;
  role: StaffRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  profile_id: string | null;
  employee_code: string;
  full_name: string;
  phone: string | null;
  route: string | null;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  client_code: string;
  full_name: string;
  phone: string | null;
  ghana_card_no: string | null;
  town: string | null;
  photo_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  agent_id: string | null;
  status: ClientStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  agent_id: string | null;
  status: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  client_id: string;
  tranche_index: 0 | 1 | 2;
  status: GroupMemberStatus;
  joined_at: string;
}

export interface Account {
  id: string;
  client_id: string;
  account_type: AccountType;
  account_number: string;
  status: AccountStatus;
  opened_at: string;
  closed_at: string | null;
}

export interface SusuCycle {
  id: string;
  account_id: string;
  cycle_number: number;
  daily_amount: number;
  start_date: string;
  end_date: string;
  status: SusuCycleStatus;
  created_at: string;
}

export interface SusuContribution {
  id: string;
  cycle_id: string;
  collected_by: string | null;
  amount: number;
  collected_at: string;
  cash_session_id: string | null;
  ledger_transaction_id: string | null;
  offline_client_ref: string | null;
  created_at: string;
}

export interface FixedDeposit {
  id: string;
  client_id: string;
  fd_number: string;
  principal: number;
  annual_rate: number;
  term_months: number;
  start_date: string;
  maturity_date: string;
  status: FdStatus;
  created_at: string;
}

export interface Loan {
  id: string;
  loan_number: string;
  loan_type: LoanType;
  client_id: string | null;
  group_id: string | null;
  principal: number;
  monthly_flat_rate: number;
  term_months: number;
  frequency: RepaymentFrequency;
  processing_fee: number;
  status: LoanStatus;
  applied_at: string;
  approved_by: string | null;
  approved_at: string | null;
  disbursed_by: string | null;
  disbursed_at: string | null;
  created_at: string;
}

export interface LoanSchedule {
  id: string;
  loan_id: string;
  period_number: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  total_due: number;
  status: ScheduleStatus;
}

export interface LoanRepayment {
  id: string;
  loan_id: string;
  schedule_id: string | null;
  amount: number;
  penalty: number;
  paid_at: string;
  collected_by: string | null;
  created_at: string;
}

export interface CashSession {
  id: string;
  agent_id: string;
  session_date: string;
  opening_float: number;
  declared_cash: number | null;
  status: CashSessionStatus;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface TreasuryPlacement {
  id: string;
  instrument: string;
  principal: number;
  annual_rate: number;
  placed_date: string;
  maturity_date: string;
  status: "active" | "matured";
  created_at: string;
}

export interface ProductConfig {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface RatioHistoryRow {
  id: string;
  snapshot_date: string;
  oss: number | null;
  fss: number | null;
  roa: number | null;
  roe: number | null;
  portfolio_yield: number | null;
  par30: number | null;
  write_off_ratio: number | null;
  risk_coverage_ratio: number | null;
  operating_expense_ratio: number | null;
  liquidity_ratio: number | null;
  loan_to_deposit_ratio: number | null;
  net_income: number | null;
  extra: Record<string, unknown> | null;
  created_at: string;
}

export interface Approval {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  amount: number | null;
  requested_by: string | null;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  status: ApprovalStatus;
  notes: string | null;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
}

export interface Application {
  id: string;
  reference_code: string;
  product: string;
  full_name: string;
  phone: string;
  email: string | null;
  ghana_card_no: string | null;
  town: string | null;
  amount: number | null;
  frequency: string | null;
  status: ApplicationStatus;
  notes: string | null;
  created_at: string;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  subject: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  author: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  town: string | null;
  quote: string;
  photo_url: string | null;
  product: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
}

export interface Rate {
  id: string;
  product: string;
  label: string;
  rate: number;
  unit: string;
  min_amount: number | null;
  max_amount: number | null;
  term_months: number | null;
  sort_order: number;
  active: boolean;
}

export interface SiteStat {
  id: string;
  label: string;
  value: number;
  suffix: string | null;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  full_name: string;
  role_title: string;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  published: boolean;
}

export interface AccountBalanceRow {
  account_id: string;
  client_id: string;
  account_type: AccountType;
  status: AccountStatus;
  balance: number;
}

export interface LoanBalanceRow {
  loan_id: string;
  client_id: string | null;
  group_id: string | null;
  status: LoanStatus;
  outstanding_principal: number;
}

export interface LoanParBucketRow {
  loan_id: string;
  client_id: string | null;
  group_id: string | null;
  outstanding_principal: number;
  days_past_due: number;
}

export interface InstitutionTotalsRow {
  liquid_assets: number;
  gross_loan_portfolio: number;
  total_deposits: number;
  group_collateral: number;
  loan_loss_reserve: number;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

export interface GlTrialBalanceRow {
  gl_account_id: string;
  code: string;
  name: string;
  class: "asset" | "liability" | "equity" | "income" | "expense";
  normal_balance: "debit" | "credit";
  total_debit: number;
  total_credit: number;
  balance: number;
}
