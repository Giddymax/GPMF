-- Homepage hero slideshow, editable from Admin -> Content & Settings.
-- Mirrors the testimonials/team_members content pattern (public read when
-- published, manager/admin write), plus its own Storage bucket for the
-- slide images (mirroring the client-photos bucket).

create table hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  eyebrow text,
  headline text not null,
  subheading text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table hero_slides enable row level security;
create policy hero_slides_public_read on hero_slides for select using (published = true);
create policy hero_slides_staff_all on hero_slides for all using (is_manager_or_admin()) with check (is_manager_or_admin());

insert into storage.buckets (id, name, public)
values ('hero-slides', 'hero-slides', true)
on conflict (id) do nothing;

create policy "Managers can upload hero slide images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hero-slides' and public.is_manager_or_admin());

create policy "Managers can update hero slide images"
  on storage.objects for update to authenticated
  using (bucket_id = 'hero-slides' and public.is_manager_or_admin());

create policy "Managers can delete hero slide images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'hero-slides' and public.is_manager_or_admin());

create policy "Public can view hero slide images"
  on storage.objects for select
  using (bucket_id = 'hero-slides');
