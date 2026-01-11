-- Multi-tenant isolation layer (recommended)
-- Goal:
-- - Public (anon) cannot read tables directly
-- - Authenticated users can only see/write rows for their own client_id (tenant)
-- - Superadmin can manage everything

-- 1) Profiles table: maps auth.users -> clients
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  role text not null check (role in ('agent','admin','superadmin')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_client_id_idx on public.profiles(client_id);

-- 2) Helper functions
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), (auth.jwt() ->> 'role'), '');
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
as $$
  select public.current_role() = 'superadmin';
$$;

create or replace function public.current_client_id()
returns uuid
language sql
stable
as $$
  select p.client_id from public.profiles p where p.user_id = auth.uid();
$$;

-- 3) Tighten RLS
-- IMPORTANT: This will remove public read. Website visitors should be served via Next.js server (service role),
-- not by exposing tables to anon.

alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.profiles enable row level security;

-- Drop previous "public read" + admin-write policies if exist
drop policy if exists "clients_public_read" on public.clients;
drop policy if exists "properties_public_read" on public.properties;
drop policy if exists "clients_admin_write" on public.clients;
drop policy if exists "properties_admin_write" on public.properties;

-- profiles: users can read their own row; superadmin can read all
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_superadmin());

-- superadmin can manage profiles (assign users to clients)
drop policy if exists "profiles_superadmin_write" on public.profiles;
create policy "profiles_superadmin_write"
on public.profiles
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

-- clients: tenant-scoped select; superadmin all
drop policy if exists "clients_select_scoped" on public.clients;
create policy "clients_select_scoped"
on public.clients
for select
to authenticated
using (public.is_superadmin() or id = public.current_client_id());

-- superadmin can write clients
drop policy if exists "clients_superadmin_write" on public.clients;
create policy "clients_superadmin_write"
on public.clients
for all
to authenticated
using (public.is_superadmin())
with check (public.is_superadmin());

-- properties: tenant-scoped select; superadmin all
drop policy if exists "properties_select_scoped" on public.properties;
create policy "properties_select_scoped"
on public.properties
for select
to authenticated
using (public.is_superadmin() or client_id = public.current_client_id());

-- properties: tenant-scoped write for role admin/agent; superadmin all
drop policy if exists "properties_write_scoped" on public.properties;
create policy "properties_write_scoped"
on public.properties
for insert
to authenticated
with check (
  public.is_superadmin()
  or (
    client_id = public.current_client_id()
    and public.current_role() in ('admin','agent')
  )
);

drop policy if exists "properties_update_scoped" on public.properties;
create policy "properties_update_scoped"
on public.properties
for update
to authenticated
using (
  public.is_superadmin()
  or (
    client_id = public.current_client_id()
    and public.current_role() in ('admin','agent')
  )
)
with check (
  public.is_superadmin()
  or (
    client_id = public.current_client_id()
    and public.current_role() in ('admin','agent')
  )
);

drop policy if exists "properties_delete_scoped" on public.properties;
create policy "properties_delete_scoped"
on public.properties
for delete
to authenticated
using (
  public.is_superadmin()
  or (
    client_id = public.current_client_id()
    and public.current_role() in ('admin','agent')
  )
);

-- 4) Storage: keep public read, but only admins/agents can write into their tenant folder
-- NOTE: Storage RLS cannot reliably infer "current tenant folder" from request host.
-- We enforce tenant folder prefix in application code. This policy just blocks non-admin users.

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

drop policy if exists "property_images_auth_write" on storage.objects;
create policy "property_images_auth_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (public.is_superadmin() or public.current_role() in ('admin','agent'))
);

drop policy if exists "property_images_auth_update" on storage.objects;
create policy "property_images_auth_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-images'
  and (public.is_superadmin() or public.current_role() in ('admin','agent'))
)
with check (
  bucket_id = 'property-images'
  and (public.is_superadmin() or public.current_role() in ('admin','agent'))
);

drop policy if exists "property_images_auth_delete" on storage.objects;
create policy "property_images_auth_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-images'
  and (public.is_superadmin() or public.current_role() in ('admin','agent'))
);

