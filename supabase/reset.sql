-- Reset database to a clean state (keeps auth users and profiles).
-- Run manually in Supabase SQL Editor, then run seed.sql.

truncate table public.patient_history cascade;
truncate table public.patients cascade;
truncate table public.doctors cascade;

-- Optional: clear uploaded avatars (run in SQL Editor if needed)
-- delete from storage.objects where bucket_id = 'doctor-avatars';

-- Next: run the contents of seed.sql to restore sample data.
