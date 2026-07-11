-- Reference data required for the app to function at all (not demo data —
-- this always runs). Demo clients/loans/history live in supabase/seed.sql.

-- ============================================================================
-- CHART OF ACCOUNTS
-- PROV_EXP and OPEX are not named explicitly in the product brief's chart of
-- accounts list but are required so the "Loan Loss Provision" balance-sheet
-- line and operating expenses both have a matching double-entry counterpart.
-- ============================================================================
insert into gl_accounts (code, name, class, normal_balance) values
  ('CASH_HAND', 'Cash on Hand', 'asset', 'debit'),
  ('BANK', 'Bank', 'asset', 'debit'),
  ('TBILL', 'T-bill Investments', 'asset', 'debit'),
  ('LOAN_PORTFOLIO', 'Loan Portfolio', 'asset', 'debit'),
  ('INT_RECEIVABLE', 'Interest Receivable', 'asset', 'debit'),
  ('LOAN_LOSS_PROVISION', 'Loan Loss Provision', 'asset', 'credit'),
  ('SUSU_LIAB', 'Susu Liabilities', 'liability', 'credit'),
  ('SAVINGS_LIAB', 'Savings Liabilities', 'liability', 'credit'),
  ('FD_LIAB', 'Fixed Deposit Liabilities', 'liability', 'credit'),
  ('INT_PAYABLE', 'Interest Payable', 'liability', 'credit'),
  ('GROUP_COLLATERAL', 'Group Cash Collateral', 'liability', 'credit'),
  ('EQUITY', 'Equity', 'equity', 'credit'),
  ('COMM_INCOME', 'Commission Income', 'income', 'credit'),
  ('INT_INCOME', 'Interest Income', 'income', 'credit'),
  ('FEE_INCOME', 'Fee Income', 'income', 'credit'),
  ('INT_EXP', 'Interest Expense', 'expense', 'debit'),
  ('AGENT_COMM_EXP', 'Agent Commission Expense', 'expense', 'debit'),
  ('PROV_EXP', 'Loan Loss Provision Expense', 'expense', 'debit'),
  ('OPEX', 'Operating Expense', 'expense', 'debit');

-- ============================================================================
-- PRODUCT CONFIG — every rate, fee and guardrail threshold the calculators
-- and admin dashboard read, so policy changes never require a deploy.
-- ============================================================================
insert into product_config (key, value, description) values
  ('savings_rate', '{"annual_rate": 0.05}', 'Savings account interest, % p.a. on average daily balance'),
  ('fd_rates', '[{"term_months":3,"annual_rate":0.10},{"term_months":6,"annual_rate":0.12},{"term_months":12,"annual_rate":0.14}]', 'Fixed deposit rates by tenor'),
  ('susu_sparse_threshold_days', '{"days": 15}', 'Minimum days paid in a 31-day cycle to earn full (not halved) commission'),
  ('loan_monthly_flat_rate', '{"rate": 0.045}', 'Micro-loan flat interest, % per month'),
  ('loan_processing_fee_pct', '{"pct": 0.02}', 'Loan processing fee as % of principal'),
  ('loan_penalty_daily_pct', '{"pct": 0.005}', 'Late penalty, % of overdue balance per day late'),
  ('loan_penalty_cap_pct', '{"pct": 0.10}', 'Late penalty cap as % of the installment amount'),
  ('eligibility_multiplier', '{"multiplier": 2}', 'First-loan cap as a multiple of average monthly savings inflow'),
  ('group_collateral_pct', '{"pct": 0.10}', 'Compulsory group savings held as collateral, % of loan principal'),
  ('liquidity_reserve_min', '{"pct": 0.30}', 'Minimum liquid assets as % of deposit liabilities'),
  ('loan_to_deposit_max', '{"pct": 0.60}', 'Maximum gross loan portfolio as % of total deposits'),
  ('single_borrower_max_pct', '{"pct": 0.05}', 'Maximum single-borrower exposure as % of the loan portfolio'),
  ('agent_commission_pct', '{"pct": 0.10}', 'Agent commission as % of the susu commission income they generate monthly'),
  ('opex_monthly', '{"amount": 3500}', 'Fixed monthly operating cost input (rent, payroll, utilities) used in OSS/break-even calculations'),
  ('withdrawal_fee', '{"flat": 2, "pct": 0.01}', 'Savings withdrawal fee: greater of flat GHS amount or % of withdrawal');
