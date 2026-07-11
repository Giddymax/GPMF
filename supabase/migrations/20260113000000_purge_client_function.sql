-- Hard-deletes a client and everything linked to them, INCLUDING their
-- ledger history. This exists specifically to clean up dummy/demo/mis-entered
-- registrations, not for real clients with genuine activity — the ledger is
-- append-only by design (see ledger_entries_no_delete /
-- ledger_transactions_no_delete in the ledger migration) to protect real
-- financial records. This function is the one deliberate, explicit exception:
-- it disables those triggers only for the duration of its own transaction
-- (Postgres DDL is transactional, so if anything in here fails, the whole
-- purge — including the trigger disable — rolls back automatically).
--
-- For a client with real money movement, prefer closing them
-- (clients.status = 'closed', see closeClient() in the app) over purging.
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
    alter table ledger_entries disable trigger ledger_entries_no_delete;
    alter table ledger_transactions disable trigger ledger_transactions_no_delete;

    -- Delete whole transactions (every leg), not just this client's leg —
    -- otherwise a counterparty leg (e.g. an agent's cash) would be left
    -- referencing a transaction that no longer balances.
    delete from ledger_entries where transaction_id = any(v_txn_ids);
    delete from ledger_transactions where id = any(v_txn_ids);

    alter table ledger_entries enable trigger ledger_entries_no_delete;
    alter table ledger_transactions enable trigger ledger_transactions_no_delete;
  end if;

  -- loans.client_id is ON DELETE SET NULL (loans can outlive an individual
  -- client record in the schema), so remove them explicitly rather than
  -- leaving orphaned loan rows behind. loan_schedules/loan_repayments cascade
  -- from loans.
  if v_loan_ids is not null then
    delete from loans where id = any(v_loan_ids);
  end if;

  -- Cascades to: accounts, susu_cycles, susu_contributions,
  -- savings_transactions, fixed_deposits, group_members.
  delete from clients where id = p_client_id;
end;
$$;

revoke all on function purge_client from public;
grant execute on function purge_client to service_role;
