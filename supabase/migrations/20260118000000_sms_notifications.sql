-- SMS notifications to clients on transactions (Arkesel). Mirrors the
-- audit_log pattern for sms_log, and reuses the generic product_config
-- key/value store for the on/off + per-event toggles rather than a new
-- settings table.

alter table clients add column sms_opt_in boolean not null default true;

create table sms_log (
  id uuid primary key default gen_random_uuid(),
  recipient_phone text not null,
  client_id uuid references clients (id),
  event text not null,
  message text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_response text,
  created_at timestamptz not null default now()
);
create index sms_log_client_id_idx on sms_log (client_id);

alter table sms_log enable row level security;
create policy sms_log_staff_read on sms_log for select using (is_staff());

insert into product_config (key, value, description) values (
  'sms_settings',
  '{
    "enabled": true,
    "events": {
      "savings_deposit": true,
      "savings_withdrawal": true,
      "susu_contribution": true,
      "susu_payout": true,
      "loan_disbursement": true,
      "loan_repayment": true,
      "fd_booking": true,
      "fd_maturity_payout": true,
      "fd_early_withdrawal": true,
      "fd_rollover": true
    }
  }'::jsonb,
  'Master on/off switch and per-event toggles for client transaction SMS notifications.'
)
on conflict (key) do nothing;
