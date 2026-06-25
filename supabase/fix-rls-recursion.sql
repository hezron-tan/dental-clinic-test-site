-- Fix infinite recursion in profiles RLS (error 42P17).
-- Run once in Supabase SQL Editor on an existing project.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can update clinic info" on public.clinic_info;
create policy "Admins can update clinic info"
  on public.clinic_info for update
  using (public.is_admin());

drop policy if exists "Admins can insert clinic info" on public.clinic_info;
create policy "Admins can insert clinic info"
  on public.clinic_info for insert
  with check (public.is_admin());

drop policy if exists "Staff and admins can read patients" on public.patients;
create policy "Staff and admins can read patients"
  on public.patients for select
  using (public.is_staff_or_admin());

drop policy if exists "Staff and admins can insert patients" on public.patients;
create policy "Staff and admins can insert patients"
  on public.patients for insert
  with check (public.is_staff_or_admin());

drop policy if exists "Staff and admins can update patients" on public.patients;
create policy "Staff and admins can update patients"
  on public.patients for update
  using (public.is_staff_or_admin());

drop policy if exists "Admins can delete patients" on public.patients;
create policy "Admins can delete patients"
  on public.patients for delete
  using (public.is_admin());

drop policy if exists "Staff and admins can read history" on public.patient_history;
create policy "Staff and admins can read history"
  on public.patient_history for select
  using (public.is_staff_or_admin());

drop policy if exists "Staff and admins can insert history" on public.patient_history;
create policy "Staff and admins can insert history"
  on public.patient_history for insert
  with check (public.is_staff_or_admin());

drop policy if exists "Staff and admins can update history" on public.patient_history;
create policy "Staff and admins can update history"
  on public.patient_history for update
  using (public.is_staff_or_admin());

drop policy if exists "Admins can delete history" on public.patient_history;
create policy "Admins can delete history"
  on public.patient_history for delete
  using (public.is_admin());

-- Backfill profiles (use test emails when metadata is missing)
insert into public.profiles (id, role, display_name)
select id,
       case email
         when 'admin@clinic.test' then 'admin'
         when 'staff@clinic.test' then 'staff'
         else coalesce(raw_user_meta_data->>'role', 'staff')
       end,
       coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
where email in ('admin@clinic.test', 'staff@clinic.test')
on conflict (id) do update
  set role = excluded.role,
      display_name = excluded.display_name;
