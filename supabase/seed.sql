-- Seed data (optional)

-- 1) Client
insert into public.clients (company_name, slug, primary_color, logo_url, contact_info)
values
  (
    'Acme Emlak',
    'acme',
    '#16a34a',
    null,
    '{"phone":"+90 555 000 00 00","email":"info@acme.com","address":"Kadıköy, İstanbul"}'::jsonb
  )
on conflict (slug) do update
set company_name = excluded.company_name,
    primary_color = excluded.primary_color,
    logo_url = excluded.logo_url,
    contact_info = excluded.contact_info;

-- 2) Properties for that client
with c as (
  select id from public.clients where slug = 'acme'
)
insert into public.properties (client_id, title, description, price, location, features, images, status)
select
  c.id,
  '3+1 Deniz Manzaralı Daire',
  'Modern site içerisinde, ulaşım noktalarına yakın.',
  8500000,
  'İstanbul / Kadıköy',
  '{"oda":3,"salon":1,"m2":120,"asansor":true,"otopark":true}'::jsonb,
  array[]::text[],
  'satilik'
from c
where not exists (
  select 1 from public.properties p
  where p.client_id = c.id and p.title = '3+1 Deniz Manzaralı Daire'
);

