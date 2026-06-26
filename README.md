# Dental Clinic Test Site

A free-tier dental clinic practice site for **Playwright** (UI + API), **K6** (performance), and manual exploration.

- **Public site** — clinic name, address, contact, hours ([Arcana](https://html5up.net/arcana) template by HTML5 UP)
- **Staff login** — role-based access (`admin` vs `staff`)
- **Admin** — edit clinic info, manage patients, storage usage warning at 50%
- **Staff** — view/edit patients and visit history
- **Backend** — [Supabase](https://supabase.com) free tier (PostgreSQL + Auth + REST API)
- **Hosting** — [GitHub Pages](https://pages.github.com) (static frontend)

## Architecture

```
GitHub Pages (HTML/JS/CSS)  →  Supabase Auth + PostgreSQL + REST API
```

GitHub Pages serves static files only. All data and authentication go through Supabase's client SDK and auto-generated REST API — ideal for API automation practice.

## Quick start

**Full Supabase walkthrough:** [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

### 1. Create a Supabase project (free)

1. Sign up at [supabase.com](https://supabase.com) and create a project.
2. In **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Create `admin@clinic.test` and `staff@clinic.test` users (see setup guide).

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and test passwords

cp js/config.example.js js/config.js
npm run config   # or edit js/config.js manually
```

Verify backend setup:

```bash
npm run verify:supabase
```

### 3. Run locally

```bash
npm install
npm run serve
```

Open `http://127.0.0.1:4173` (or the port shown by `npm run serve`).

### 4. Run Playwright tests

```bash
npm test              # all tests (starts local server automatically)
npm run test:ui       # UI tests only
npm run test:api      # API tests only
npm run test:headed   # watch tests run in browser
```

Tests read credentials from `.env`. UI/API tests that need auth are skipped until passwords are set.

### 5. Deploy to GitHub Pages (GitHub Actions)

1. Push this repo to GitHub.
2. Add repository secrets (see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md#step-6--github-secrets-for-deploy--ci)).
3. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**.
4. Push to `main` — the **Deploy GitHub Pages** workflow builds `dist/` with your Supabase config and publishes it.

Playwright tests run automatically on push/PR via the **Playwright Tests** workflow.

## Resetting test data

To wipe patients and history while keeping auth users:

1. Run `supabase/reset.sql` in the SQL Editor.
2. Run `supabase/seed.sql` to restore sample patients.

The admin dashboard shows a **storage warning** when database usage exceeds 50% of the free tier (~500 MB).

## Playwright test suite

| File | What it covers |
|------|----------------|
| `tests/ui/public.spec.ts` | Public homepage content and nav |
| `tests/ui/login.spec.ts` | Login, role redirects, logout |
| `tests/ui/staff.spec.ts` | Patient list, edit details, add history |
| `tests/ui/admin.spec.ts` | Clinic info edit, add patient |
| `tests/api/supabase.spec.ts` | REST auth, public clinic, patient RLS |

Key `data-testid` attributes are on login, patient forms, clinic form, and navigation.

### K6 load test

```bash
k6 run -e SUPABASE_URL=https://xxx.supabase.co -e SUPABASE_ANON_KEY=eyJ... tests/k6/clinic-load.js
```

Supabase exposes a REST API at `{SUPABASE_URL}/rest/v1/`.

**List patients** (authenticated):

```http
GET /rest/v1/patients?select=*
apikey: YOUR_ANON_KEY
Authorization: Bearer USER_JWT
```

**Get clinic info** (public, no auth):

```http
GET /rest/v1/clinic_info?id=eq.1&select=*
apikey: YOUR_ANON_KEY
```

**Sign in** (get JWT for API tests):

```http
POST /auth/v1/token?grant_type=password
apikey: YOUR_ANON_KEY
Content-Type: application/json

{"email": "staff@clinic.test", "password": "your-password"}
```

Use the `access_token` from the response as `Authorization: Bearer ...` for protected endpoints.

## Project structure

```
├── .github/workflows/
│   ├── deploy-pages.yml    # GitHub Pages deploy
│   └── playwright.yml      # CI test run
├── docs/SUPABASE_SETUP.md  # Step-by-step backend setup
├── tests/
│   ├── ui/                 # Playwright UI tests
│   ├── api/                # Playwright API tests
│   ├── k6/                 # K6 performance script
│   └── helpers/            # Shared Supabase helpers
├── scripts/
│   ├── generate-config.mjs # Build config.js from env
│   ├── prepare-dist.mjs    # Package dist/ for Pages
│   └── verify-supabase.mjs # Post-setup health check
├── index.html              # Public clinic site
├── login.html
├── admin/index.html
├── staff/index.html
├── js/
├── supabase/
└── package.json
```

## Roles

| Capability | Admin | Staff |
|------------|-------|-------|
| View public clinic info | ✓ | ✓ |
| Edit clinic info | ✓ | |
| List/create/edit patients | ✓ | ✓ |
| Delete patients | ✓ | |
| View/add visit history | ✓ | ✓ |
| Storage usage warning | ✓ | |

## License

Arcana template: [CCA 3.0](https://html5up.net/license). App code: use freely for practice and testing.
