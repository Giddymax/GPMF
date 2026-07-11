-- Row Level Security.
--
-- The admin portal's server actions run against the service-role key (which
-- bypasses RLS entirely) so the money-moving business logic — maker-checker,
-- guardrails, ledger posting — lives in lib/finance and the server action
-- layer, not in policy predicates. These policies are the defense-in-depth
-- layer for anything that talks to Supabase directly with a user's own JWT
-- (the public site's anon-key reads/inserts, and the agent PWA's
-- authenticated offline-sync writes).

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

create or replace function current_staff_role() returns staff_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function current_agent_id() returns uuid
language sql stable security definer set search_path = public as $$
  select a.id from agents a join profiles p on p.id = a.profile_id where p.id = auth.uid();
$$;

create or replace function is_manager_or_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select current_staff_role() in ('manager', 'admin');
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select current_staff_role() = 'admin';
$$;

-- ============================================================================
-- PUBLIC WEBSITE CONTENT — anon may read published rows only
-- ============================================================================
alter table posts enable row level security;
create policy posts_public_read on posts for select using (published = true);
create policy posts_staff_all on posts for all using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table testimonials enable row level security;
create policy testimonials_public_read on testimonials for select using (published = true);
create policy testimonials_staff_all on testimonials for all using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table faqs enable row level security;
create policy faqs_public_read on faqs for select using (published = true);
create policy faqs_staff_all on faqs for all using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table rates enable row level security;
create policy rates_public_read on rates for select using (active = true);
create policy rates_staff_all on rates for all using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table site_stats enable row level security;
create policy site_stats_public_read on site_stats for select using (true);
create policy site_stats_staff_all on site_stats for all using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table team_members enable row level security;
create policy team_members_public_read on team_members for select using (published = true);
create policy team_members_staff_all on team_members for all using (is_manager_or_admin()) with check (is_manager_or_admin());

-- ============================================================================
-- PUBLIC WEBSITE INBOX — anon may insert only; staff manage from the admin inbox
-- ============================================================================
alter table applications enable row level security;
create policy applications_public_insert on applications for insert to anon, authenticated with check (status = 'new');
create policy applications_staff_read on applications for select using (is_staff());
create policy applications_staff_update on applications for update using (is_staff()) with check (is_staff());

alter table inquiries enable row level security;
create policy inquiries_public_insert on inquiries for insert to anon, authenticated with check (status = 'new');
create policy inquiries_staff_read on inquiries for select using (is_staff());
create policy inquiries_staff_update on inquiries for update using (is_staff()) with check (is_staff());

-- ============================================================================
-- STAFF IDENTITY
-- ============================================================================
alter table profiles enable row level security;
create policy profiles_self_read on profiles for select using (id = auth.uid() or is_manager_or_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_write on profiles for insert with check (is_admin());

alter table agents enable row level security;
create policy agents_staff_read on agents for select using (is_staff());
create policy agents_admin_write on agents for insert with check (is_manager_or_admin());
create policy agents_admin_update on agents for update using (is_manager_or_admin()) with check (is_manager_or_admin());

-- ============================================================================
-- CLIENTS, GROUPS, ACCOUNTS — staff read all; agents may register their own clients
-- ============================================================================
alter table clients enable row level security;
create policy clients_staff_read on clients for select using (is_staff());
create policy clients_staff_insert on clients for insert with check (is_staff());
create policy clients_staff_update on clients for update using (is_staff()) with check (is_staff());

alter table groups enable row level security;
create policy groups_staff_all on groups for all using (is_staff()) with check (is_staff());

alter table group_members enable row level security;
create policy group_members_staff_all on group_members for all using (is_staff()) with check (is_staff());

alter table accounts enable row level security;
create policy accounts_staff_all on accounts for all using (is_staff()) with check (is_staff());

-- ============================================================================
-- SUSU — agents record contributions for their own route; managers/admins see all
-- ============================================================================
alter table susu_cycles enable row level security;
create policy susu_cycles_staff_all on susu_cycles for all using (is_staff()) with check (is_staff());

alter table susu_contributions enable row level security;
create policy susu_contributions_staff_read on susu_contributions for select using (is_staff());
create policy susu_contributions_agent_insert on susu_contributions for insert
  with check (is_manager_or_admin() or collected_by = current_agent_id());

-- ============================================================================
-- SAVINGS, FIXED DEPOSITS, LOANS — staff read/write; large actions gated in app layer
-- ============================================================================
alter table savings_transactions enable row level security;
create policy savings_transactions_staff_all on savings_transactions for all using (is_staff()) with check (is_staff());

alter table fixed_deposits enable row level security;
create policy fixed_deposits_staff_all on fixed_deposits for all using (is_staff()) with check (is_staff());

alter table loans enable row level security;
create policy loans_staff_read on loans for select using (is_staff());
create policy loans_staff_insert on loans for insert with check (is_staff());
create policy loans_manager_update on loans for update using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table loan_schedules enable row level security;
create policy loan_schedules_staff_all on loan_schedules for all using (is_staff()) with check (is_staff());

alter table loan_repayments enable row level security;
create policy loan_repayments_staff_read on loan_repayments for select using (is_staff());
create policy loan_repayments_agent_insert on loan_repayments for insert
  with check (is_manager_or_admin() or collected_by = current_agent_id());

-- ============================================================================
-- LEDGER — every authenticated staff member may read; only server actions
-- (service role) post entries, so there is no direct-client insert policy.
-- ============================================================================
alter table gl_accounts enable row level security;
create policy gl_accounts_staff_read on gl_accounts for select using (is_staff());
create policy gl_accounts_admin_write on gl_accounts for all using (is_admin()) with check (is_admin());

alter table ledger_transactions enable row level security;
create policy ledger_transactions_staff_read on ledger_transactions for select using (is_staff());

alter table ledger_entries enable row level security;
create policy ledger_entries_staff_read on ledger_entries for select using (is_staff());

-- ============================================================================
-- CASH, TREASURY, CONFIG, RATIOS, APPROVALS, AUDIT
-- ============================================================================
alter table cash_sessions enable row level security;
create policy cash_sessions_staff_read on cash_sessions for select using (is_staff());
create policy cash_sessions_agent_insert on cash_sessions for insert
  with check (is_manager_or_admin() or agent_id = current_agent_id());
create policy cash_sessions_agent_update on cash_sessions for update
  using (is_manager_or_admin() or agent_id = current_agent_id())
  with check (is_manager_or_admin() or agent_id = current_agent_id());

alter table treasury_placements enable row level security;
create policy treasury_placements_staff_read on treasury_placements for select using (is_staff());
create policy treasury_placements_manager_write on treasury_placements for all
  using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table product_config enable row level security;
create policy product_config_staff_read on product_config for select using (is_staff());
create policy product_config_admin_write on product_config for all using (is_admin()) with check (is_admin());

alter table ratio_history enable row level security;
create policy ratio_history_staff_read on ratio_history for select using (is_staff());

alter table approvals enable row level security;
create policy approvals_staff_read on approvals for select using (is_staff());
create policy approvals_staff_insert on approvals for insert with check (is_staff());
create policy approvals_manager_update on approvals for update using (is_manager_or_admin()) with check (is_manager_or_admin());

alter table audit_log enable row level security;
create policy audit_log_staff_read on audit_log for select using (is_staff());
