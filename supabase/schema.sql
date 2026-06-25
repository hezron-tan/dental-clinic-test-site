-- Dental Clinic Test Site — Supabase schema
-- Run in Supabase SQL Editor after creating your project.

-- ---------------------------------------------------------------------------
-- Profiles (roles: admin | staff)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'staff')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Clinic info (single row, public read)
-- ---------------------------------------------------------------------------
create table if not exists public.clinic_info (
  id int primary key default 1 check (id = 1),
  name text not null default 'Bright Smile Dental Clinic',
  tagline text not null default 'Your trusted neighborhood dental care',
  address text not null default '123 Main Street, Suite 100, Portland, OR 97201',
  phone text not null default '(503) 555-0142',
  email text not null default 'hello@brightsmile-dental.test',
  hours text not null default 'Mon–Fri 8:00 AM – 6:00 PM | Sat 9:00 AM – 1:00 PM',
  updated_at timestamptz not null default now()
);

alter table public.clinic_info enable row level security;

create policy "Anyone can read clinic info"
  on public.clinic_info for select
  using (true);

create policy "Admins can update clinic info"
  on public.clinic_info for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can insert clinic info"
  on public.clinic_info for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  email text,
  phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;

create policy "Staff and admins can read patients"
  on public.patients for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "Staff and admins can insert patients"
  on public.patients for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "Staff and admins can update patients"
  on public.patients for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "Admins can delete patients"
  on public.patients for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Patient visit history
-- ---------------------------------------------------------------------------
create table if not exists public.patient_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  visit_date date not null default current_date,
  procedure_type text not null,
  description text,
  dentist_name text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.patient_history enable row level security;

create policy "Staff and admins can read history"
  on public.patient_history for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "Staff and admins can insert history"
  on public.patient_history for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "Staff and admins can update history"
  on public.patient_history for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "Admins can delete history"
  on public.patient_history for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (role from user metadata, default staff)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'staff'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Storage usage helper (admin only) — Supabase free tier ~500 MB
-- ---------------------------------------------------------------------------
create or replace function public.get_storage_usage()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  db_size bigint;
  max_size bigint := 524288000;
  is_admin boolean;
begin
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ) into is_admin;

  if not is_admin then
    raise exception 'Admin access required';
  end if;

  select pg_database_size(current_database()) into db_size;

  return json_build_object(
    'used_bytes', db_size,
    'max_bytes', max_size,
    'used_percent', round((db_size::numeric / max_size::numeric) * 100, 1)
  );
end;
$$;

grant execute on function public.get_storage_usage() to authenticated;

-- Updated_at trigger for patients
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_updated_at on public.patients;
create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();
