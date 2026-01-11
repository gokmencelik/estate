-- White-label Real Estate SaaS (Supabase) schema
-- Tables: clients, properties
-- RLS: Public read, admin write (based on JWT app_metadata.role = 'admin')

-- 1) Extensions
create extension if not exists "pgcrypto";

-- 2) Helper: admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or coalesce((auth.jwt() ->> 'role') = 'admin', false);
$$;

-- 3) Tables
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  slug text not null unique,
  primary_color text null, -- hex like '#2563eb'
  logo_url text null,
  contact_info jsonb null,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text null,
  price numeric not null check (price >= 0),
  location text not null,
  features jsonb null,
  images text[] null,
  status text not null check (status in ('satilik','kiralik')),
  created_at timestamptz not null default now()
);

create index if not exists properties_client_id_idx on public.properties(client_id);

-- 4) RLS
alter table public.clients enable row level security;
alter table public.properties enable row level security;

-- Public read
drop policy if exists "clients_public_read" on public.clients;
create policy "clients_public_read"
on public.clients
for select
to public
using (true);

drop policy if exists "properties_public_read" on public.properties;
create policy "properties_public_read"
on public.properties
for select
to public
using (true);

-- Admin write (insert/update/delete)
drop policy if exists "clients_admin_write" on public.clients;
create policy "clients_admin_write"
on public.clients
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "properties_admin_write" on public.properties;
create policy "properties_admin_write"
on public.properties
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 5) Storage bucket + policies for images (optional but recommended)
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = true;

-- Public read objects in this bucket
drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

-- Admin can upload/update/delete objects in this bucket
drop policy if exists "property_images_admin_insert" on storage.objects;
create policy "property_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'property-images' and public.is_admin());

drop policy if exists "property_images_admin_update" on storage.objects;
create policy "property_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'property-images' and public.is_admin())
with check (bucket_id = 'property-images' and public.is_admin());

drop policy if exists "property_images_admin_delete" on storage.objects;
create policy "property_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'property-images' and public.is_admin());

