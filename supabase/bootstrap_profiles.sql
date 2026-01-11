-- Bootstrap example: create 2 clients + map 2 users to them
-- Steps:
-- 1) Create clients (or create from /admin/clients as superadmin)
-- 2) Find user ids from Supabase Dashboard -> Auth -> Users
-- 3) Insert profiles rows

-- 1) Clients (example)
insert into public.clients (company_name, slug, primary_color, logo_url, contact_info)
values
  ('GM İnşaat', 'gminsaat', '#16a34a', null, null),
  ('X İnşaat', 'xinsaat', '#2563eb', null, null)
on conflict (slug) do update
set company_name = excluded.company_name,
    primary_color = excluded.primary_color,
    logo_url = excluded.logo_url;

-- 2) Map users to clients
-- Replace these placeholders with real UUIDs from Auth -> Users
-- GM admin user_id:
--   11111111-1111-1111-1111-111111111111
-- X admin user_id:
--   22222222-2222-2222-2222-222222222222

with gm as (select id from public.clients where slug = 'gminsaat'),
     xi as (select id from public.clients where slug = 'xinsaat')
insert into public.profiles (user_id, client_id, role)
values
  ('11111111-1111-1111-1111-111111111111'::uuid, (select id from gm), 'admin'),
  ('22222222-2222-2222-2222-222222222222'::uuid, (select id from xi), 'admin')
on conflict (user_id) do update
set client_id = excluded.client_id,
    role = excluded.role;

