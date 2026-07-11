-- Fixes a circular foreign-key bug discovered while purging a client:
-- savings_transactions/susu_contributions/fixed_deposits/loans/loan_repayments
-- each hold a `ledger_transaction_id` FK pointing AT their ledger transaction
-- (added with no ON DELETE behavior, so it defaults to NO ACTION/RESTRICT).
-- purge_client() and admin_delete_ledger_transaction() both try to delete the
-- ledger transaction while those rows still reference it, which Postgres
-- correctly refuses. Fix: null out the referencing column on any row that
-- points at the transaction being deleted, immediately before deleting it —
-- those rows are either about to be cascade-deleted anyway (purge_client) or
-- are meant to survive with their history intact but no longer linkable to a
-- (now gone) ledger transaction (a lone transaction delete elsewhere).
create or replace function admin_delete_ledger_transaction(p_transaction_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update savings_transactions set ledger_transaction_id = null where ledger_transaction_id = p_transaction_id;
  update susu_contributions set ledger_transaction_id = null where ledger_transaction_id = p_transaction_id;
  update fixed_deposits set ledger_transaction_id = null where ledger_transaction_id = p_transaction_id;
  update loans set ledger_transaction_id = null where ledger_transaction_id = p_transaction_id;
  update loan_repayments set ledger_transaction_id = null where ledger_transaction_id = p_transaction_id;

  alter table ledger_entries disable trigger ledger_entries_no_delete;
  alter table ledger_transactions disable trigger ledger_transactions_no_delete;
  delete from ledger_entries where transaction_id = p_transaction_id;
  delete from ledger_transactions where id = p_transaction_id;
  alter table ledger_entries enable trigger ledger_entries_no_delete;
  alter table ledger_transactions enable trigger ledger_transactions_no_delete;
end;
$$;

create or replace function purge_client(p_client_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_ids uuid[];
  v_loan_ids uuid[];
  v_fd_ids uuid[];
  v_txn_ids uuid[];
begin
  select array_agg(id) into v_account_ids from accounts where client_id = p_client_id;
  select array_agg(id) into v_loan_ids from loans where client_id = p_client_id;
  select array_agg(id) into v_fd_ids from fixed_deposits where client_id = p_client_id;

  select array_agg(distinct transaction_id) into v_txn_ids
  from ledger_entries
  where client_account_id = any(coalesce(v_account_ids, array[]::uuid[]))
     or loan_id = any(coalesce(v_loan_ids, array[]::uuid[]))
     or fixed_deposit_id = any(coalesce(v_fd_ids, array[]::uuid[]));

  if v_txn_ids is not null then
    update savings_transactions set ledger_transaction_id = null where ledger_transaction_id = any(v_txn_ids);
    update susu_contributions set ledger_transaction_id = null where ledger_transaction_id = any(v_txn_ids);
    update fixed_deposits set ledger_transaction_id = null where ledger_transaction_id = any(v_txn_ids);
    update loans set ledger_transaction_id = null where ledger_transaction_id = any(v_txn_ids);
    update loan_repayments set ledger_transaction_id = null where ledger_transaction_id = any(v_txn_ids);

    alter table ledger_entries disable trigger ledger_entries_no_delete;
    alter table ledger_transactions disable trigger ledger_transactions_no_delete;

    delete from ledger_entries where transaction_id = any(v_txn_ids);
    delete from ledger_transactions where id = any(v_txn_ids);

    alter table ledger_entries enable trigger ledger_entries_no_delete;
    alter table ledger_transactions enable trigger ledger_transactions_no_delete;
  end if;

  if v_loan_ids is not null then
    delete from loans where id = any(v_loan_ids);
  end if;

  delete from clients where id = p_client_id;
end;
$$;

revoke all on function admin_delete_ledger_transaction from public;
revoke all on function purge_client from public;
grant execute on function admin_delete_ledger_transaction to service_role;
grant execute on function purge_client to service_role;
