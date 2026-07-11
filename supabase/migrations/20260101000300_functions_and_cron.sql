-- Posting helper + the automated jobs described in the build spec §6.4.
--
-- NOTE: these functions have been authored to be correct against the schema
-- above but have not been exercised against a live database (this project
-- ships without a connected Supabase instance). Before relying on them with
-- real money, run `supabase db reset`, call each function manually against
-- seeded data, and check the resulting ledger/ratio_history rows.

-- ============================================================================
-- GENERIC POSTING HELPER
-- Application code (server actions) calls this via supabase.rpc() with the
-- service-role client so a whole balanced transaction is written atomically.
-- p_legs is a JSON array of {gl_code, debit, credit, client_account_id,
-- loan_id, fixed_deposit_id, group_id, agent_id, flow_category}.
-- ============================================================================
create or replace function post_ledger_transaction(
  p_description text,
  p_reference_type text,
  p_reference_id uuid,
  p_legs jsonb,
  p_created_by uuid default null,
  p_entry_date date default current_date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn_id uuid;
  v_leg jsonb;
  v_gl_id uuid;
begin
  if jsonb_array_length(p_legs) < 2 then
    raise exception 'A ledger transaction needs at least two legs';
  end if;

  insert into ledger_transactions (entry_date, description, reference_type, reference_id, created_by)
  values (p_entry_date, p_description, p_reference_type, p_reference_id, p_created_by)
  returning id into v_txn_id;

  for v_leg in select * from jsonb_array_elements(p_legs) loop
    select id into v_gl_id from gl_accounts where code = v_leg->>'gl_code';
    if v_gl_id is null then
      raise exception 'Unknown GL account code %', v_leg->>'gl_code';
    end if;

    insert into ledger_entries (
      transaction_id, gl_account_id, debit, credit,
      client_account_id, loan_id, fixed_deposit_id, group_id, agent_id, flow_category
    ) values (
      v_txn_id,
      v_gl_id,
      coalesce((v_leg->>'debit')::numeric, 0),
      coalesce((v_leg->>'credit')::numeric, 0),
      nullif(v_leg->>'client_account_id', '')::uuid,
      nullif(v_leg->>'loan_id', '')::uuid,
      nullif(v_leg->>'fixed_deposit_id', '')::uuid,
      nullif(v_leg->>'group_id', '')::uuid,
      nullif(v_leg->>'agent_id', '')::uuid,
      v_leg->>'flow_category'
    );
  end loop;

  return v_txn_id;
end;
$$;

revoke all on function post_ledger_transaction from public;
grant execute on function post_ledger_transaction to service_role;

-- ============================================================================
-- Reverses a transaction with an equal-and-opposite mirror transaction,
-- keeping the ledger append-only.
-- ============================================================================
create or replace function reverse_ledger_transaction(
  p_transaction_id uuid,
  p_reason text,
  p_created_by uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_txn_id uuid;
  v_original ledger_transactions%rowtype;
begin
  select * into v_original from ledger_transactions where id = p_transaction_id;
  if not found then
    raise exception 'Ledger transaction % not found', p_transaction_id;
  end if;

  insert into ledger_transactions (entry_date, description, reference_type, reference_id, created_by, reverses_transaction_id)
  values (current_date, 'Reversal: ' || p_reason, v_original.reference_type, v_original.reference_id, p_created_by, p_transaction_id)
  returning id into v_new_txn_id;

  insert into ledger_entries (
    transaction_id, gl_account_id, debit, credit,
    client_account_id, loan_id, fixed_deposit_id, group_id, agent_id, flow_category
  )
  select
    v_new_txn_id, gl_account_id, credit, debit,
    client_account_id, loan_id, fixed_deposit_id, group_id, agent_id, flow_category
  from ledger_entries
  where transaction_id = p_transaction_id;

  return v_new_txn_id;
end;
$$;

revoke all on function reverse_ledger_transaction from public;
grant execute on function reverse_ledger_transaction to service_role;

-- ============================================================================
-- EOD: force-close any cash session still open past the cutoff, flagging it
-- for manual reconciliation instead of silently carrying it forward.
-- ============================================================================
create or replace function run_eod_autolock() returns void
language plpgsql security definer set search_path = public as $$
begin
  update cash_sessions
  set status = 'closed', closed_at = now()
  where status = 'open' and session_date < current_date;
end;
$$;

-- ============================================================================
-- NIGHTLY: overdue re-bucketing + loan loss provision true-up + group gate refresh.
-- ============================================================================
create or replace function run_nightly_accruals() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_required_provision numeric;
  v_current_reserve numeric;
  v_delta numeric;
begin
  -- Re-bucket overdue schedules.
  update loan_schedules
  set status = 'overdue'
  where status = 'pending' and due_date < current_date;

  -- True-up the Loan Loss Provision reserve to match the CGAP ladder applied
  -- to today's PAR buckets (see lib/finance/loans.ts provision()).
  select coalesce(sum(
    case
      when days_past_due <= 0 then outstanding_principal * 0.01
      when days_past_due <= 30 then outstanding_principal * 0.10
      when days_past_due <= 90 then outstanding_principal * 0.50
      else outstanding_principal * 1.00
    end
  ), 0)
  into v_required_provision
  from loan_par_buckets;

  select coalesce(balance, 0) into v_current_reserve
  from gl_trial_balance where code = 'LOAN_LOSS_PROVISION';

  v_delta := v_required_provision - coalesce(v_current_reserve, 0);

  if v_delta > 0.005 then
    perform post_ledger_transaction(
      'Nightly loan loss provision true-up',
      'provision_true_up',
      null,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'PROV_EXP', 'debit', v_delta),
        jsonb_build_object('gl_code', 'LOAN_LOSS_PROVISION', 'credit', v_delta)
      )
    );
  elsif v_delta < -0.005 then
    perform post_ledger_transaction(
      'Nightly loan loss provision release',
      'provision_true_up',
      null,
      jsonb_build_array(
        jsonb_build_object('gl_code', 'LOAN_LOSS_PROVISION', 'debit', -v_delta),
        jsonb_build_object('gl_code', 'PROV_EXP', 'credit', -v_delta)
      )
    );
  end if;

  -- Refresh Grameen group-gate member status from each member's own loan delinquency.
  update group_members gm
  set status = case
    when lb.outstanding_principal = 0 and l.status = 'closed' then 'completed'
    when lpb.days_past_due > 0 then 'overdue'
    when l.status = 'disbursed' then 'current'
    else gm.status
  end
  from loans l
  left join loan_balances lb on lb.loan_id = l.id
  left join loan_par_buckets lpb on lpb.loan_id = l.id
  where l.group_id = gm.group_id and l.client_id = gm.client_id
    and gm.status not in ('pending');
end;
$$;

-- ============================================================================
-- END-OF-MONTH: post savings interest, mature susu cycles/FDs (ready for the
-- admin payout/maturity queues), pay agent commission, snapshot ratio_history.
-- ============================================================================
create or replace function run_eom_close(p_close_date date default current_date) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_savings_rate numeric;
  v_agent_commission_pct numeric;
  v_opex_monthly numeric;
  v_month_start date := date_trunc('month', p_close_date)::date;
  v_acct record;
  v_interest numeric;
  v_agent record;
  v_commission_income numeric;
  v_agent_commission numeric;

  v_financial_revenue numeric;
  v_financial_expense numeric;
  v_operating_expense numeric;
  v_prov_expense numeric;
  v_net_income numeric;
  v_totals institution_totals%rowtype;
  v_par30_outstanding numeric;
begin
  select coalesce((value->>'annual_rate')::numeric, 0.05) into v_savings_rate
  from product_config where key = 'savings_rate';
  v_savings_rate := coalesce(v_savings_rate, 0.05);

  select coalesce((value->>'pct')::numeric, 0.10) into v_agent_commission_pct
  from product_config where key = 'agent_commission_pct';
  v_agent_commission_pct := coalesce(v_agent_commission_pct, 0.10);

  select coalesce((value->>'amount')::numeric, 0) into v_opex_monthly
  from product_config where key = 'opex_monthly';
  v_opex_monthly := coalesce(v_opex_monthly, 0);

  -- 1) Post monthly savings interest on each active savings account's current balance.
  for v_acct in
    select ab.account_id, ab.balance
    from account_balances ab
    where ab.account_type = 'savings' and ab.status = 'active' and ab.balance > 0
  loop
    v_interest := round(v_acct.balance * v_savings_rate / 12, 2);
    if v_interest > 0 then
      perform post_ledger_transaction(
        'Monthly savings interest',
        'savings_interest',
        v_acct.account_id,
        jsonb_build_array(
          jsonb_build_object('gl_code', 'INT_EXP', 'debit', v_interest, 'flow_category', 'savings_interest_expense'),
          jsonb_build_object('gl_code', 'SAVINGS_LIAB', 'credit', v_interest, 'client_account_id', v_acct.account_id)
        )
      );
      insert into savings_transactions (account_id, type, amount)
      values (v_acct.account_id, 'interest', v_interest);
    end if;
  end loop;

  -- 2) Close matured susu cycles (payout/rollover happens from the admin payout queue).
  update susu_cycles
  set status = 'completed'
  where status = 'active' and end_date <= p_close_date;

  -- 3) Mature fixed deposits (payout happens from the admin FD maturity calendar).
  update fixed_deposits
  set status = 'matured'
  where status = 'active' and maturity_date <= p_close_date;

  -- 4) Pay each agent a commission on the susu commission income they generated this month.
  for v_agent in select id from agents where active = true loop
    select coalesce(sum(le.credit - le.debit), 0) into v_commission_income
    from ledger_entries le
    join ledger_transactions lt on lt.id = le.transaction_id
    where le.agent_id = v_agent.id
      and le.flow_category = 'susu_commission'
      and lt.entry_date >= v_month_start and lt.entry_date <= p_close_date;

    v_agent_commission := round(coalesce(v_commission_income, 0) * v_agent_commission_pct, 2);
    if v_agent_commission > 0 then
      perform post_ledger_transaction(
        'Monthly agent commission',
        'agent_commission',
        v_agent.id,
        jsonb_build_array(
          jsonb_build_object('gl_code', 'AGENT_COMM_EXP', 'debit', v_agent_commission, 'agent_id', v_agent.id, 'flow_category', 'agent_commission_expense'),
          jsonb_build_object('gl_code', 'CASH_HAND', 'credit', v_agent_commission, 'agent_id', v_agent.id)
        )
      );
    end if;
  end loop;

  -- 5) Snapshot the SEEP/CGAP ratios for the trend charts.
  select * into v_totals from institution_totals;

  select coalesce(sum(net_amount), 0) into v_financial_revenue
  from monthly_flows
  where month = v_month_start and flow_category in ('susu_commission', 'loan_interest', 'fee_income', 'treasury_income');

  select coalesce(sum(-net_amount), 0) into v_financial_expense
  from monthly_flows
  where month = v_month_start and flow_category in ('savings_interest_expense', 'fd_interest_expense');

  select coalesce(sum(-net_amount), 0) into v_operating_expense
  from monthly_flows
  where month = v_month_start and flow_category = 'operating_expense';
  v_operating_expense := v_operating_expense + v_opex_monthly;

  select coalesce(sum(-net_amount), 0) into v_prov_expense
  from monthly_flows
  where month = v_month_start and flow_category = 'loan_loss_provision_expense';

  select coalesce(sum(outstanding_principal), 0) into v_par30_outstanding
  from loan_par_buckets where days_past_due > 30;

  v_net_income := v_financial_revenue - v_financial_expense - v_operating_expense - v_prov_expense;

  insert into ratio_history (
    snapshot_date, oss, fss, roa, roe, portfolio_yield, par30, write_off_ratio,
    risk_coverage_ratio, operating_expense_ratio, liquidity_ratio, loan_to_deposit_ratio,
    net_income, extra
  ) values (
    p_close_date,
    case when (v_financial_expense + v_prov_expense + v_operating_expense) = 0 then null
      else v_financial_revenue / (v_financial_expense + v_prov_expense + v_operating_expense) end,
    case when v_financial_expense + v_operating_expense = 0 then null
      else v_financial_revenue / (v_financial_expense + v_operating_expense) end,
    case when v_totals.total_assets = 0 then null else v_net_income / v_totals.total_assets end,
    case when v_totals.total_equity = 0 then null else v_net_income / v_totals.total_equity end,
    case when v_totals.gross_loan_portfolio = 0 then null
      else (select coalesce(sum(net_amount), 0) from monthly_flows where month = v_month_start and flow_category = 'loan_interest') / v_totals.gross_loan_portfolio end,
    case when v_totals.gross_loan_portfolio = 0 then null else v_par30_outstanding / v_totals.gross_loan_portfolio end,
    null,
    case when v_par30_outstanding = 0 then null else v_totals.loan_loss_reserve / v_par30_outstanding end,
    case when v_totals.gross_loan_portfolio = 0 then null else v_operating_expense / v_totals.gross_loan_portfolio end,
    case when v_totals.total_deposits = 0 then null else v_totals.liquid_assets / v_totals.total_deposits end,
    case when v_totals.total_deposits = 0 then null else v_totals.gross_loan_portfolio / v_totals.total_deposits end,
    v_net_income,
    jsonb_build_object('financial_revenue', v_financial_revenue, 'financial_expense', v_financial_expense, 'operating_expense', v_operating_expense)
  )
  on conflict (snapshot_date) do update set
    oss = excluded.oss, fss = excluded.fss, roa = excluded.roa, roe = excluded.roe,
    portfolio_yield = excluded.portfolio_yield, par30 = excluded.par30,
    risk_coverage_ratio = excluded.risk_coverage_ratio, operating_expense_ratio = excluded.operating_expense_ratio,
    liquidity_ratio = excluded.liquidity_ratio, loan_to_deposit_ratio = excluded.loan_to_deposit_ratio,
    net_income = excluded.net_income, extra = excluded.extra;
end;
$$;

-- ============================================================================
-- Agent cash-up (called from the admin susu collections screen).
-- ============================================================================
create or replace function close_cash_session(
  p_session_id uuid,
  p_declared_cash numeric,
  p_closed_by uuid
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update cash_sessions
  set declared_cash = p_declared_cash, status = 'reconciled', closed_by = p_closed_by, closed_at = now()
  where id = p_session_id;
end;
$$;

revoke all on function run_eod_autolock, run_nightly_accruals, run_eom_close, close_cash_session from public;
grant execute on function run_eod_autolock, run_nightly_accruals, run_eom_close, close_cash_session to service_role;

-- ============================================================================
-- CRON SCHEDULING — wrapped so the migration still succeeds on projects where
-- the pg_cron extension has not been enabled from the Supabase dashboard yet.
-- ============================================================================
do $setup_cron$
begin
  create extension if not exists pg_cron;

  perform cron.schedule('grainy-palace-eod-autolock', '0 21 * * *', $cron$select run_eod_autolock();$cron$);
  perform cron.schedule('grainy-palace-nightly-accruals', '30 21 * * *', $cron$select run_nightly_accruals();$cron$);
  perform cron.schedule('grainy-palace-eom-close', '0 22 28-31 * *', $cron$
    select run_eom_close(current_date)
    where current_date = (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
  $cron$);
exception when others then
  raise notice 'pg_cron not available yet — enable it in the Supabase dashboard (Database > Extensions) and re-run the cron.schedule() calls in this block manually.';
end;
$setup_cron$;
