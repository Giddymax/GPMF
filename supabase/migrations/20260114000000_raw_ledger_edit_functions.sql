-- Raw, unrestricted edit/delete of posted ledger transactions — at the
-- application's explicit request, overriding the append-only design used
-- everywhere else (ledger_transactions_no_update/no_delete,
-- ledger_entries_no_update/no_delete in the ledger migration).
--
-- These do NOT re-check that a transaction stays balanced after editing —
-- since every balance in the app is a live view over the ledger, an edit
-- here can retroactively change historical balances/reports with no audit
-- trail beyond audit_log's before/after snapshot. Scoped as dedicated
-- functions (rather than dropping the triggers outright) so every other
-- code path in the app keeps the append-only protection; only the admin
-- Ledger page's Edit/Delete buttons call these.
create or replace function admin_update_ledger_transaction(
  p_transaction_id uuid,
  p_description text,
  p_entry_date date
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  alter table ledger_transactions disable trigger ledger_transactions_no_update;
  update ledger_transactions
  set description = p_description, entry_date = p_entry_date
  where id = p_transaction_id;
  alter table ledger_transactions enable trigger ledger_transactions_no_update;
end;
$$;

create or replace function admin_update_ledger_entry(
  p_entry_id uuid,
  p_debit numeric,
  p_credit numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  alter table ledger_entries disable trigger ledger_entries_no_update;
  update ledger_entries
  set debit = p_debit, credit = p_credit
  where id = p_entry_id;
  alter table ledger_entries enable trigger ledger_entries_no_update;
end;
$$;

create or replace function admin_delete_ledger_transaction(p_transaction_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  alter table ledger_entries disable trigger ledger_entries_no_delete;
  alter table ledger_transactions disable trigger ledger_transactions_no_delete;
  delete from ledger_entries where transaction_id = p_transaction_id;
  delete from ledger_transactions where id = p_transaction_id;
  alter table ledger_entries enable trigger ledger_entries_no_delete;
  alter table ledger_transactions enable trigger ledger_transactions_no_delete;
end;
$$;

revoke all on function admin_update_ledger_transaction from public;
revoke all on function admin_update_ledger_entry from public;
revoke all on function admin_delete_ledger_transaction from public;
grant execute on function admin_update_ledger_transaction to service_role;
grant execute on function admin_update_ledger_entry to service_role;
grant execute on function admin_delete_ledger_transaction to service_role;
