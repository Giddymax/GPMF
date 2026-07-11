-- Ledger integrity triggers + read-side views. No balance columns are stored
-- anywhere else in the schema — every balance in the app is one of these views.

-- ============================================================================
-- IMMUTABILITY: the ledger is append-only. Corrections are new reversal
-- transactions, never edits, so history can always be reconstructed.
-- ============================================================================
create or replace function forbid_ledger_mutation() returns trigger as $$
begin
  raise exception '% is append-only: % is not permitted on %', TG_TABLE_NAME, TG_OP, TG_TABLE_NAME;
end;
$$ language plpgsql;

create trigger ledger_transactions_no_update
  before update on ledger_transactions
  for each row execute function forbid_ledger_mutation();
create trigger ledger_transactions_no_delete
  before delete on ledger_transactions
  for each row execute function forbid_ledger_mutation();
create trigger ledger_entries_no_update
  before update on ledger_entries
  for each row execute function forbid_ledger_mutation();
create trigger ledger_entries_no_delete
  before delete on ledger_entries
  for each row execute function forbid_ledger_mutation();

-- ============================================================================
-- BALANCE INTEGRITY: sum(debit) must equal sum(credit) within a transaction.
-- Deferred so a multi-leg transaction can be inserted row-by-row and is only
-- checked once, at commit.
-- ============================================================================
create or replace function check_ledger_transaction_balanced() returns trigger as $$
declare
  txn_id uuid := coalesce(new.transaction_id, old.transaction_id);
  total_debit numeric;
  total_credit numeric;
begin
  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into total_debit, total_credit
    from ledger_entries
    where transaction_id = txn_id;

  if total_debit <> total_credit then
    raise exception 'Ledger transaction % is not balanced: debits % <> credits %',
      txn_id, total_debit, total_credit;
  end if;

  return null;
end;
$$ language plpgsql;

create constraint trigger ledger_entries_balanced
  after insert on ledger_entries
  deferrable initially deferred
  for each row execute function check_ledger_transaction_balanced();

-- ============================================================================
-- SUBSIDIARY BALANCE VIEWS
-- ============================================================================

-- Savings + susu account balances (liability GL lines tagged with client_account_id).
create view account_balances as
select
  a.id as account_id,
  a.client_id,
  a.account_type,
  a.status,
  coalesce(sum(le.credit - le.debit), 0) as balance
from accounts a
left join ledger_entries le on le.client_account_id = a.id
group by a.id, a.client_id, a.account_type, a.status;

-- Fixed deposit outstanding principal (liability GL lines tagged with fixed_deposit_id).
create view fd_balances as
select
  fd.id as fixed_deposit_id,
  fd.client_id,
  fd.status,
  fd.principal,
  fd.maturity_date,
  coalesce(sum(le.credit - le.debit), 0) as ledger_balance
from fixed_deposits fd
left join ledger_entries le on le.fixed_deposit_id = fd.id
group by fd.id, fd.client_id, fd.status, fd.principal, fd.maturity_date;

-- Loan outstanding principal (asset GL lines tagged with loan_id; disbursement
-- debits Loan Portfolio, repayment of principal credits it back down).
create view loan_balances as
select
  l.id as loan_id,
  l.client_id,
  l.group_id,
  l.status,
  coalesce(sum(le.debit - le.credit), 0) as outstanding_principal
from loans l
left join ledger_entries le on le.loan_id = l.id
group by l.id, l.client_id, l.group_id, l.status;

-- Group cash collateral held against a Grameen-style group's loans.
create view group_collateral_balances as
select
  g.id as group_id,
  coalesce(sum(le.credit - le.debit), 0) as collateral_balance
from groups g
left join ledger_entries le on le.group_id = g.id
group by g.id;

-- Cash on hand per agent (asset GL lines tagged with agent_id).
create view agent_cash_balances as
select
  ag.id as agent_id,
  coalesce(sum(le.debit - le.credit), 0) as cash_on_hand
from agents ag
left join ledger_entries le on le.agent_id = ag.id
  and le.gl_account_id = (select id from gl_accounts where code = 'CASH_HAND')
group by ag.id;

-- General ledger trial balance: signed balance per account per its own normal side.
create view gl_trial_balance as
select
  gl.id as gl_account_id,
  gl.code,
  gl.name,
  gl.class,
  gl.normal_balance,
  coalesce(sum(le.debit), 0) as total_debit,
  coalesce(sum(le.credit), 0) as total_credit,
  case
    when gl.normal_balance = 'debit' then coalesce(sum(le.debit - le.credit), 0)
    else coalesce(sum(le.credit - le.debit), 0)
  end as balance
from gl_accounts gl
left join ledger_entries le on le.gl_account_id = gl.id
group by gl.id, gl.code, gl.name, gl.class, gl.normal_balance;

-- ============================================================================
-- INSTITUTION-LEVEL POINT-IN-TIME TOTALS (balance-sheet side of the ratios)
-- ============================================================================
create view institution_totals as
select
  coalesce((select sum(balance) from gl_trial_balance where code in ('CASH_HAND', 'BANK', 'TBILL')), 0) as liquid_assets,
  coalesce((select balance from gl_trial_balance where code = 'LOAN_PORTFOLIO'), 0) as gross_loan_portfolio,
  coalesce((select sum(balance) from gl_trial_balance where code in ('SUSU_LIAB', 'SAVINGS_LIAB', 'FD_LIAB')), 0) as total_deposits,
  coalesce((select balance from gl_trial_balance where code = 'GROUP_COLLATERAL'), 0) as group_collateral,
  coalesce((select balance from gl_trial_balance where code = 'LOAN_LOSS_PROVISION'), 0) as loan_loss_reserve,
  coalesce((select sum(balance) from gl_trial_balance where class = 'asset'), 0) as total_assets,
  coalesce((select sum(balance) from gl_trial_balance where class = 'liability'), 0) as total_liabilities,
  coalesce((select sum(balance) from gl_trial_balance where class = 'equity'), 0) as total_equity;

-- Loan portfolio outstanding balance, bucketed by days past due against the
-- oldest unpaid installment on each loan. Feeds PAR ladder + provisioning.
create view loan_par_buckets as
select
  lb.loan_id,
  lb.client_id,
  lb.group_id,
  lb.outstanding_principal,
  coalesce(
    (
      select current_date - ls.due_date
      from loan_schedules ls
      where ls.loan_id = lb.loan_id and ls.status in ('pending', 'partial', 'overdue')
      order by ls.due_date asc
      limit 1
    ),
    0
  ) as days_past_due
from loan_balances lb
where lb.status = 'disbursed' and lb.outstanding_principal > 0;

-- Monthly P&L-style flows, grouped by the flow_category tag set at posting time.
-- This is where susu commission, loan interest, fees, treasury income, savings/FD
-- interest expense, agent commission and opex are read from for the SEEP ratios.
create view monthly_flows as
select
  date_trunc('month', lt.entry_date)::date as month,
  le.flow_category,
  sum(le.credit - le.debit) as net_amount
from ledger_entries le
join ledger_transactions lt on lt.id = le.transaction_id
where le.flow_category is not null
group by 1, 2;
