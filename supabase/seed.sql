-- Seed data for dental clinic test site.
-- Run AFTER schema.sql and AFTER creating auth users (see README).

-- Default clinic info (safe to re-run)
insert into public.clinic_info (id, name, tagline, address, phone, email, hours)
values (
  1,
  'Bright Smile Dental Clinic',
  'Gentle care for every smile — your neighborhood dental practice',
  '123 Main Street, Suite 100, Portland, OR 97201',
  '(503) 555-0142',
  'hello@brightsmile-dental.test',
  'Mon–Fri 8:00 AM – 6:00 PM | Sat 9:00 AM – 1:00 PM'
)
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  address = excluded.address,
  phone = excluded.phone,
  email = excluded.email,
  hours = excluded.hours,
  updated_at = now();

-- Sample patients (only if table is empty)
insert into public.patients (
  first_name, last_name, date_of_birth, email, phone, address,
  emergency_contact_name, emergency_contact_phone, notes
)
select * from (values
  ('Alice', 'Johnson', '1985-03-12'::date, 'alice.j@example.test', '(503) 555-1001',
   '45 Oak Ave, Portland, OR', 'Bob Johnson', '(503) 555-1002', 'Mild dental anxiety'),
  ('Carlos', 'Mendez', '1992-07-22'::date, 'carlos.m@example.test', '(503) 555-2001',
   '88 Pine St, Portland, OR', 'Maria Mendez', '(503) 555-2002', 'Allergic to penicillin'),
  ('Diana', 'Chen', '1978-11-05'::date, 'diana.c@example.test', '(503) 555-3001',
   '12 River Rd, Portland, OR', 'James Chen', '(503) 555-3002', null)
) as v(first_name, last_name, date_of_birth, email, phone, address,
       emergency_contact_name, emergency_contact_phone, notes)
where not exists (select 1 from public.patients limit 1);

-- Sample history for first patient
insert into public.patient_history (patient_id, visit_date, procedure_type, description, dentist_name, notes)
select p.id, '2025-01-15'::date, 'Checkup', 'Routine exam and cleaning', 'Dr. Smith', 'No cavities found'
from public.patients p
where p.first_name = 'Alice' and p.last_name = 'Johnson'
  and not exists (
    select 1 from public.patient_history h
    where h.patient_id = p.id and h.visit_date = '2025-01-15'
  );

insert into public.patient_history (patient_id, visit_date, procedure_type, description, dentist_name, notes)
select p.id, '2025-06-10'::date, 'Filling', 'Composite filling on tooth #14', 'Dr. Smith', 'Patient tolerated well'
from public.patients p
where p.first_name = 'Alice' and p.last_name = 'Johnson'
  and not exists (
    select 1 from public.patient_history h
    where h.patient_id = p.id and h.visit_date = '2025-06-10'
  );
