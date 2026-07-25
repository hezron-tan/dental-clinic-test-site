-- Incremental migration: doctors table + profile-picture storage bucket.
-- Run in Supabase SQL Editor if schema.sql was already applied earlier.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT / DROP POLICY IF EXISTS).

-- ---------------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------------
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  profile_picture_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.doctors enable row level security;

drop policy if exists "Anyone can read doctors" on public.doctors;
create policy "Anyone can read doctors"
  on public.doctors for select
  using (true);

drop policy if exists "Admins can insert doctors" on public.doctors;
create policy "Admins can insert doctors"
  on public.doctors for insert
  with check (public.is_admin());

drop policy if exists "Admins can update doctors" on public.doctors;
create policy "Admins can update doctors"
  on public.doctors for update
  using (public.is_admin());

drop policy if exists "Admins can delete doctors" on public.doctors;
create policy "Admins can delete doctors"
  on public.doctors for delete
  using (public.is_admin());

-- Requires set_updated_at() from schema.sql
drop trigger if exists doctors_updated_at on public.doctors;
create trigger doctors_updated_at
  before update on public.doctors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket: doctor-avatars (public read for homepage/admin thumbs)
-- Max 2 MB; JPEG / PNG / WebP / GIF only
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-avatars',
  'doctor-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view doctor avatars" on storage.objects;
create policy "Anyone can view doctor avatars"
  on storage.objects for select
  using (bucket_id = 'doctor-avatars');

drop policy if exists "Admins can upload doctor avatars" on storage.objects;
create policy "Admins can upload doctor avatars"
  on storage.objects for insert
  with check (bucket_id = 'doctor-avatars' and public.is_admin());

drop policy if exists "Admins can update doctor avatars" on storage.objects;
create policy "Admins can update doctor avatars"
  on storage.objects for update
  using (bucket_id = 'doctor-avatars' and public.is_admin());

drop policy if exists "Admins can delete doctor avatars" on storage.objects;
create policy "Admins can delete doctor avatars"
  on storage.objects for delete
  using (bucket_id = 'doctor-avatars' and public.is_admin());
