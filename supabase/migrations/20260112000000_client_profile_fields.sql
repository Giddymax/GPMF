-- Expands client registration: fuller personal info, structured location,
-- an identification photo, multiple product interest, a robust
-- sequence-backed client code, and next-of-kin details.

-- ============================================================================
-- MORE PERSONAL INFO, LOCATION, PRODUCT INTEREST, NEXT OF KIN
-- ============================================================================
alter table clients
  add column if not exists occupation text,
  add column if not exists email text,
  add column if not exists region text,
  add column if not exists area text,
  add column if not exists digital_address text,
  add column if not exists interested_products text[] not null default '{}',
  add column if not exists next_of_kin_name text,
  add column if not exists next_of_kin_relationship text,
  add column if not exists next_of_kin_phone text,
  add column if not exists next_of_kin_address text;

comment on column clients.interested_products is
  'Product slugs the client expressed interest in at registration: savings, daily-susu, fixed-deposit, loans. Multiple allowed.';

-- Ghana Card is the sole identification document (per product decision — no
-- multi-document support). Enforce uniqueness; a partial index (rather than
-- a plain NOT NULL + UNIQUE column constraint) tolerates any existing rows
-- that predate this field without breaking the migration, while still
-- rejecting any two clients from sharing a card number going forward.
create unique index if not exists clients_ghana_card_no_unique
  on clients (ghana_card_no)
  where ghana_card_no is not null;

-- ============================================================================
-- ROBUST SEQUENTIAL CLIENT CODES
-- The admin UI previously generated "GPFS-000N" by counting existing rows and
-- adding one — a race condition if two agents register clients at the same
-- moment. A real sequence + a DB-level default makes generation atomic and
-- removes the client-code logic from application code entirely.
-- ============================================================================
create sequence if not exists client_code_seq;

-- Continue from the highest existing GPFS-#### suffix (e.g. demo-seeded
-- clients) instead of restarting at 1.
select setval(
  'client_code_seq',
  coalesce((select max(substring(client_code from 'GPFS-(\d+)')::int) from clients), 0)
);

create or replace function next_client_code() returns text
language plpgsql as $$
begin
  return 'GPFS-' || lpad(nextval('client_code_seq')::text, 4, '0');
end;
$$;

alter table clients alter column client_code set default next_client_code();

-- ============================================================================
-- IDENTIFICATION PHOTO STORAGE
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', true)
on conflict (id) do nothing;

create policy "Staff can upload client photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-photos' and public.is_staff());

create policy "Staff can update client photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'client-photos' and public.is_staff());

create policy "Public can view client photos"
  on storage.objects for select
  using (bucket_id = 'client-photos');
