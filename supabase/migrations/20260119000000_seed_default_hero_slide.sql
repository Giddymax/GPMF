-- Seeds one default hero slide (mirroring the original hardcoded hero copy /
-- lib/data/fallback.ts's fallbackHeroSlides) so Admin -> Content & Settings ->
-- Hero slides has something real to edit instead of starting empty. Guarded
-- so it only inserts on a table with no rows yet — safe to run on a project
-- where staff have already added their own slides.
insert into hero_slides (
  image_url,
  eyebrow,
  headline,
  subheading,
  primary_cta_label,
  primary_cta_href,
  secondary_cta_label,
  secondary_cta_href,
  sort_order,
  published
)
select
  null,
  'Licensed last-mile financial services',
  'Save a little every day. Build something big.',
  'Daily susu, savings, fixed deposits and micro-loans — brought to your stall, your shop, your doorstep. As trustworthy as a bank, as familiar as your local susu collector.',
  'Open an Account',
  '/apply',
  'See how susu works',
  '/products/daily-susu',
  1,
  true
where not exists (select 1 from hero_slides);
