-- Fixed Deposit lifecycle: maturity payout, early withdrawal (request/approve/
-- reject), and rollover. Previously fixed_deposits.status was flipped to
-- 'matured' by run_eom_close() with no payout ever posted, and there was no
-- early-withdrawal or rollover path at all.
--
-- Maker-checker for early withdrawal / rollover reuses the existing
-- `approvals` table (entity_type = 'fixed_deposit') rather than adding new
-- fd_status values for pending states, matching the pattern already used for
-- savings_withdrawal approvals.

alter type fd_status add value if not exists 'withdrawn';

alter table fixed_deposits
  add column rolled_into_fd_id uuid references fixed_deposits (id),
  add column rolled_from_fd_id uuid references fixed_deposits (id);

create table fd_events (
  id uuid primary key default gen_random_uuid(),
  fd_id uuid not null references fixed_deposits (id) on delete cascade,
  event_type text not null check (event_type in (
    'early_withdrawal_requested',
    'early_withdrawal_approved',
    'early_withdrawal_rejected',
    'matured_paid_out',
    'rollover_requested',
    'rollover_completed',
    'rollover_rejected'
  )),
  amount numeric(12, 2),
  actor_id uuid references profiles (id),
  notes text,
  created_at timestamptz not null default now()
);
create index fd_events_fd_id_idx on fd_events (fd_id);

alter table fd_events enable row level security;
create policy fd_events_staff_read on fd_events for select using (is_staff());
create policy fd_events_staff_insert on fd_events for insert with check (is_staff());
