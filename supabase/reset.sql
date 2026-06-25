-- Reset database to a clean state (keeps auth users and profiles).
-- Run manually in Supabase SQL Editor, then run seed.sql.

truncate table public.patient_history cascade;
truncate table public.patients cascade;

-- Next: run the contents of seed.sql to restore sample data.
