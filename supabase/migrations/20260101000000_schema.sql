-- Grainy Palace Financial Service — core schema
-- gen_random_uuid() is built into Postgres 13+ (used by Supabase), no extension required.

create extension if not exists pgcrypto;

-- ============================================================================
-- ENUMS
-- ============================================================================
create type staff_role as enum ('agent', 'manager', 'admin');
create type client_status as enum ('active', 'dormant', 'closed');
create type account_type as enum ('savings', 'susu');
create type account_status as enum ('active', 'dormant', 'closed');
create type susu_cycle_status as enum ('active', 'completed', 'paid_out', 'rolled_over');
create type savings_txn_type as enum ('deposit', 'withdrawal', 'interest', 'fee');
create type fd_status as enum ('active', 'matured', 'terminated_early', 'rolled_over');
create type loan_type as enum ('individual', 'group');
create type loan_status as enum (
  'pending', 'appraisal', 'approved', 'disbursed', 'closed', 'written_off', 'rejected'
);
create type repayment_frequency as enum ('daily', 'weekly', 'monthly');
create type schedule_status as enum ('pending', 'paid', 'partial', 'overdue');
create type group_member_status as enum ('pending', 'current', 'overdue', 'defaulted', 'completed');
create type gl_account_class as enum ('asset', 'liability', 'equity', 'income', 'expense');
create type normal_balance as enum ('debit', 'credit');
create type cash_session_status as enum ('open', 'closed', 'reconciled');
create type treasury_status as enum ('active', 'matured');
create type approval_status as enum ('pending', 'approved', 'rejected');
create type application_status as enum ('new', 'contacted', 'opened', 'rejected');
create type inquiry_status as enum ('new', 'contacted', 'resolved');

-- ============================================================================
-- IDENTITY & STAFF
-- ============================================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role staff_role not null default 'agent',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
comment on table profiles is 'One row per staff/admin login (Supabase Auth user). Public applicants never get a profile.';

create table agents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles (id) on delete set null,
  employee_code text not null unique,
  full_name text not null,
  phone text,
  route text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CLIENTS & GROUPS
-- ============================================================================
create table clients (
  id uuid primary key default gen_random_uuid(),
  client_code text not null unique,
  full_name text not null,
  phone text,
  ghana_card_no text,
  town text,
  photo_url text,
  gender text,
  date_of_birth date,
  agent_id uuid references agents (id) on delete set null,
  status client_status not null default 'active',
  created_at timestamptz not null default now()
);
create index clients_agent_id_idx on clients (agent_id);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agent_id uuid references agents (id) on delete set null,
  status text not null default 'forming',
  created_at timestamptz not null default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  tranche_index smallint not null check (tranche_index in (0, 1, 2)),
  status group_member_status not null default 'pending',
  joined_at timestamptz not null default now(),
  unique (group_id, client_id)
);
create index group_members_group_id_idx on group_members (group_id);

-- ============================================================================
-- ACCOUNTS (savings + susu)
-- ============================================================================
create table accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  account_type account_type not null,
  account_number text not null unique,
  status account_status not null default 'active',
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create index accounts_client_id_idx on accounts (client_id);

create table susu_cycles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  cycle_number int not null,
  daily_amount numeric(12, 2) not null check (daily_amount > 0),
  start_date date not null,
  end_date date not null,
  status susu_cycle_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (account_id, cycle_number)
);
create index susu_cycles_account_id_idx on susu_cycles (account_id);

create table susu_contributions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references susu_cycles (id) on delete cascade,
  collected_by uuid references agents (id),
  amount numeric(12, 2) not null check (amount > 0),
  collected_at timestamptz not null default now(),
  cash_session_id uuid,
  ledger_transaction_id uuid,
  offline_client_ref text,
  created_at timestamptz not null default now()
);
create index susu_contributions_cycle_id_idx on susu_contributions (cycle_id);
create unique index susu_contributions_offline_ref_idx on susu_contributions (offline_client_ref)
  where offline_client_ref is not null;

create table savings_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  type savings_txn_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  ledger_transaction_id uuid,
  created_by uuid references profiles (id),
  approved_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index savings_transactions_account_id_idx on savings_transactions (account_id);

-- ============================================================================
-- FIXED DEPOSITS
-- ============================================================================
create table fixed_deposits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  fd_number text not null unique,
  principal numeric(12, 2) not null check (principal > 0),
  annual_rate numeric(6, 4) not null,
  term_months int not null check (term_months > 0),
  start_date date not null,
  maturity_date date not null,
  status fd_status not null default 'active',
  ledger_transaction_id uuid,
  created_at timestamptz not null default now()
);
create index fixed_deposits_client_id_idx on fixed_deposits (client_id);

-- ============================================================================
-- LOANS
-- ============================================================================
create table loans (
  id uuid primary key default gen_random_uuid(),
  loan_number text not null unique,
  loan_type loan_type not null,
  client_id uuid references clients (id) on delete set null,
  group_id uuid references groups (id) on delete set null,
  principal numeric(12, 2) not null check (principal > 0),
  monthly_flat_rate numeric(6, 4) not null,
  term_months int not null check (term_months > 0),
  frequency repayment_frequency not null default 'weekly',
  processing_fee numeric(12, 2) not null default 0,
  status loan_status not null default 'pending',
  applied_at timestamptz not null default now(),
  approved_by uuid references profiles (id),
  approved_at timestamptz,
  disbursed_by uuid references profiles (id),
  disbursed_at timestamptz,
  ledger_transaction_id uuid,
  created_at timestamptz not null default now(),
  constraint loans_party_check check (
    (loan_type = 'individual' and client_id is not null)
    or (loan_type = 'group' and group_id is not null)
  )
);
create index loans_client_id_idx on loans (client_id);
create index loans_group_id_idx on loans (group_id);

create table loan_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans (id) on delete cascade,
  period_number int not null,
  due_date date not null,
  principal_due numeric(12, 2) not null,
  interest_due numeric(12, 2) not null,
  total_due numeric(12, 2) not null,
  status schedule_status not null default 'pending',
  unique (loan_id, period_number)
);
create index loan_schedules_loan_id_idx on loan_schedules (loan_id);

create table loan_repayments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans (id) on delete cascade,
  schedule_id uuid references loan_schedules (id),
  amount numeric(12, 2) not null check (amount > 0),
  penalty numeric(12, 2) not null default 0,
  paid_at timestamptz not null default now(),
  collected_by uuid references agents (id),
  ledger_transaction_id uuid,
  created_at timestamptz not null default now()
);
create index loan_repayments_loan_id_idx on loan_repayments (loan_id);

-- ============================================================================
-- LEDGER (double-entry, append-only source of truth)
-- ============================================================================
create table gl_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  class gl_account_class not null,
  normal_balance normal_balance not null
);

create table ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  description text not null,
  reference_type text not null,
  reference_id uuid,
  created_by uuid references profiles (id),
  approved_by uuid references profiles (id),
  -- Set only on a reversal row, pointing back at the transaction it reverses.
  -- The original transaction is never edited (true append-only ledger).
  reverses_transaction_id uuid references ledger_transactions (id),
  created_at timestamptz not null default now()
);
create index ledger_transactions_reference_idx on ledger_transactions (reference_type, reference_id);
create index ledger_transactions_entry_date_idx on ledger_transactions (entry_date);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references ledger_transactions (id) on delete cascade,
  gl_account_id uuid not null references gl_accounts (id),
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  client_account_id uuid references accounts (id),
  loan_id uuid references loans (id),
  fixed_deposit_id uuid references fixed_deposits (id),
  group_id uuid references groups (id),
  agent_id uuid references agents (id),
  -- Tags the P&L line this leg represents, so ratio views can group by
  -- source without re-deriving it from gl_account_id + reference_type.
  flow_category text,
  created_at timestamptz not null default now(),
  constraint ledger_entries_single_side check (
    (debit > 0 and credit = 0) or (credit > 0 and debit = 0)
  )
);
create index ledger_entries_transaction_id_idx on ledger_entries (transaction_id);
create index ledger_entries_gl_account_id_idx on ledger_entries (gl_account_id);
create index ledger_entries_client_account_id_idx on ledger_entries (client_account_id);
create index ledger_entries_loan_id_idx on ledger_entries (loan_id);
create index ledger_entries_fixed_deposit_id_idx on ledger_entries (fixed_deposit_id);
create index ledger_entries_group_id_idx on ledger_entries (group_id);
create index ledger_entries_agent_id_idx on ledger_entries (agent_id);
create index ledger_entries_flow_category_idx on ledger_entries (flow_category);

alter table susu_contributions
  add constraint susu_contributions_ledger_txn_fk
  foreign key (ledger_transaction_id) references ledger_transactions (id);
alter table savings_transactions
  add constraint savings_transactions_ledger_txn_fk
  foreign key (ledger_transaction_id) references ledger_transactions (id);
alter table fixed_deposits
  add constraint fixed_deposits_ledger_txn_fk
  foreign key (ledger_transaction_id) references ledger_transactions (id);
alter table loans
  add constraint loans_ledger_txn_fk
  foreign key (ledger_transaction_id) references ledger_transactions (id);
alter table loan_repayments
  add constraint loan_repayments_ledger_txn_fk
  foreign key (ledger_transaction_id) references ledger_transactions (id);

-- ============================================================================
-- CASH & TREASURY
-- ============================================================================
create table cash_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents (id),
  session_date date not null default current_date,
  opening_float numeric(12, 2) not null default 0,
  declared_cash numeric(12, 2),
  status cash_session_status not null default 'open',
  closed_by uuid references profiles (id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agent_id, session_date)
);

alter table susu_contributions
  add constraint susu_contributions_cash_session_fk
  foreign key (cash_session_id) references cash_sessions (id);

create table treasury_placements (
  id uuid primary key default gen_random_uuid(),
  instrument text not null default 'T-bill',
  principal numeric(14, 2) not null check (principal > 0),
  annual_rate numeric(6, 4) not null,
  placed_date date not null,
  maturity_date date not null,
  status treasury_status not null default 'active',
  ledger_transaction_id uuid references ledger_transactions (id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CONFIGURATION, RATIOS, GOVERNANCE
-- ============================================================================
create table product_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

create table ratio_history (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  oss numeric(8, 4),
  fss numeric(8, 4),
  roa numeric(8, 4),
  roe numeric(8, 4),
  portfolio_yield numeric(8, 4),
  par30 numeric(8, 4),
  write_off_ratio numeric(8, 4),
  risk_coverage_ratio numeric(8, 4),
  operating_expense_ratio numeric(8, 4),
  liquidity_ratio numeric(8, 4),
  loan_to_deposit_ratio numeric(8, 4),
  net_income numeric(14, 2),
  extra jsonb,
  created_at timestamptz not null default now()
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  amount numeric(14, 2),
  requested_by uuid references profiles (id),
  requested_at timestamptz not null default now(),
  approved_by uuid references profiles (id),
  approved_at timestamptz,
  status approval_status not null default 'pending',
  notes text
);
create index approvals_entity_idx on approvals (entity_type, entity_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on audit_log (entity_type, entity_id);

-- ============================================================================
-- PUBLIC WEBSITE CONTENT & INBOX
-- ============================================================================
create table applications (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  product text not null,
  full_name text not null,
  phone text not null,
  email text,
  ghana_card_no text,
  town text,
  amount numeric(12, 2),
  frequency text,
  status application_status not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  subject text,
  message text not null,
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  cover_image_url text,
  author text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  town text,
  quote text not null,
  photo_url text,
  product text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  sort_order int not null default 0,
  published boolean not null default true
);

create table rates (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  label text not null,
  rate numeric(8, 4) not null,
  unit text not null default 'pa',
  min_amount numeric(12, 2),
  max_amount numeric(12, 2),
  term_months int,
  sort_order int not null default 0,
  active boolean not null default true
);

create table site_stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value numeric(14, 2) not null,
  suffix text,
  sort_order int not null default 0
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text not null,
  bio text,
  photo_url text,
  sort_order int not null default 0,
  published boolean not null default true
);
