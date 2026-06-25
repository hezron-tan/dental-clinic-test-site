# Supabase setup guide

Follow these steps once to create your free backend. Takes about 10–15 minutes.

## Checklist

- [ ] 1. Create Supabase account and project
- [ ] 2. Run database schema and seed SQL
- [ ] 3. Create admin and staff test users
- [ ] 4. Copy API keys into `js/config.js`
- [ ] 5. Run verification script
- [ ] 6. Add GitHub repository secrets (for CI/CD)

---

## Step 1 — Create a project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign up (free).
2. Click **New project**.
3. Choose:
   - **Name:** `dental-clinic-test` (or any name)
   - **Database password:** generate and **save it** (you rarely need it for this app)
   - **Region:** closest to you
4. Wait ~2 minutes for the project to provision.

---

## Step 2 — Run SQL

1. Open your project → **SQL Editor** → **New query**.
2. Copy the entire contents of [`supabase/schema.sql`](../supabase/schema.sql) and click **Run**.
3. Open a new query, paste [`supabase/seed.sql`](../supabase/seed.sql), and **Run**.

You should see `clinic_info` and 3 sample patients in **Table Editor**.

---

## Step 3 — Create test users

1. Go to **Authentication** → **Users** → **Add user** → **Create new user**.

### Admin user

| Field | Value |
|-------|-------|
| Email | `admin@clinic.test` |
| Password | Choose a password (e.g. `TestAdmin123!`) |
| Auto Confirm User | **On** |
| User Metadata (raw JSON) | `{"role": "admin", "display_name": "Admin User"}` |

### Staff user

| Field | Value |
|-------|-------|
| Email | `staff@clinic.test` |
| Password | Choose a password (e.g. `TestStaff123!`) |
| Auto Confirm User | **On** |
| User Metadata (raw JSON) | `{"role": "staff", "display_name": "Staff User"}` |

The trigger in `schema.sql` automatically creates a row in `profiles` with the correct role.

### Troubleshooting profiles

**RLS infinite recursion (`42P17`)** — if verify reports profile/patient failures but sign-in works, run [`supabase/fix-rls-recursion.sql`](../supabase/fix-rls-recursion.sql) in the SQL Editor. The original `profiles` policies queried `profiles` again inside RLS, which PostgreSQL rejects.

**Admin profile wrong role** — if only the admin check fails but staff passes, the admin user was likely created without `{"role": "admin"}` metadata, so their profile defaulted to `staff`. Run in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@clinic.test');
```

Or re-run the backfill at the end of [`supabase/fix-rls-recursion.sql`](../supabase/fix-rls-recursion.sql) (it assigns roles by test email).

If users were created **before** running `schema.sql`, the fix script also backfills `profiles`. Or run this manually (once per user):

```sql
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
```

---

## Step 4 — Get API keys

1. **Project Settings** (gear icon) → **API**.
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

Create `js/config.js`:

```bash
cp js/config.example.js js/config.js
```

Edit `js/config.js` and paste your URL and anon key.

Or generate from the terminal:

```bash
# PowerShell
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ..."
node scripts/generate-config.mjs
```

---

## Step 5 — Verify setup

```bash
# PowerShell
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ..."
$env:ADMIN_PASSWORD="TestAdmin123!"
$env:STAFF_PASSWORD="TestStaff123!"
node scripts/verify-supabase.mjs
```

All lines should show `OK:`. Fix any `FAIL:` message before running tests.

---

## Step 6 — GitHub secrets (for deploy + CI)

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon public key |
| `ADMIN_EMAIL` | `admin@clinic.test` |
| `ADMIN_PASSWORD` | your admin password |
| `STAFF_EMAIL` | `staff@clinic.test` |
| `STAFF_PASSWORD` | your staff password |

Enable GitHub Pages: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

---

## Resetting test data

When patients/history get messy during automation practice:

1. SQL Editor → run [`supabase/reset.sql`](../supabase/reset.sql)
2. SQL Editor → run [`supabase/seed.sql`](../supabase/seed.sql)

Auth users and clinic info are preserved (clinic info is re-upserted by seed).

---

## Optional — Supabase CLI

If you install the [Supabase CLI](https://supabase.com/docs/guides/cli), you can link a local project:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

For this static-site project, the dashboard + SQL Editor is usually enough.
