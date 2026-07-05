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

### Playwright self-healing (Healer agent)

Playwright ships a native **Healer** agent that repairs tests when UI changes break selectors (not when the app is actually broken). This repo uses a **heal-and-propose** pattern in CI: tests still gate merges; the Healer opens a PR with proposed fixes for you to review.

Official docs: [Playwright Test Agents](https://playwright.dev/docs/test-agents)

#### Step 1 — Upgrade Playwright and install dependencies

Playwright agents require **v1.56+**:

```bash
npm install
npx playwright install chromium
```

#### Step 2 — Initialize agent definitions

Generate the Planner, Generator, and Healer agent files (re-run after Playwright upgrades):

```bash
npm run agents:init          # Claude Code / Cursor (recommended)
# npm run agents:init:vscode   # VS Code agent panel
# npm run agents:init:copilot  # GitHub Copilot
```

This creates agent instruction files under `.claude/agents/` (or `.github/agents/` for Copilot) and wires the [Playwright MCP](https://playwright.dev/docs/getting-started-mcp) server.

#### Step 3 — Heal locally in Cursor

With Playwright MCP enabled in Cursor, ask the Healer to fix a failing spec:

> Use the Playwright Healer agent to fix failing tests in `tests/ui/login.spec.ts`. Follow Page Object Model — edit `tests/pages/` when locators break. Do not weaken assertions.

The Healer will run tests, inspect the page via MCP, patch locators, and re-run until green.

#### Step 4 — Add the GitHub secret for CI healing

In **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `CURSOR_API_KEY` | API key from [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations) |

The Healer workflow is optional — without this secret, normal Playwright CI still runs unchanged. Usage is billed through your **Cursor plan** (not a separate Anthropic account).

See also: [Cursor CLI in GitHub Actions](https://cursor.com/docs/cli/github-actions)

#### Step 5 — How CI self-healing works

Two workflows cooperate:

| Workflow | When it runs | Purpose |
|----------|--------------|---------|
| **Playwright Tests** | Push / PR to `main` | Runs the suite; uploads traces on failure |
| **Playwright Healer** | After a failed test run, or manually | Proposes locator fixes via PR |

**Automatic:** When **Playwright Tests** or **Daily Playwright + Allure** fails, **Playwright Healer** starts automatically (if `CURSOR_API_KEY` is set).

**Manual:** **Actions → Playwright Healer → Run workflow**. Optionally pass a spec path (e.g. `tests/ui/staff.spec.ts`).

When triggered automatically after a failed run, the Healer checks out the same commit that failed so fixes apply to the correct branch.

The Healer uses the [Cursor CLI](https://cursor.com/docs/cli/github-actions) with Playwright MCP (`.cursor/mcp.json`) in headless mode. It never auto-merges — review the PR like any other change.

#### Tracing for the Healer

`playwright.config.ts` uses `trace: 'retain-on-failure'` in CI so failed runs include traces in the **playwright-test-results** artifact. Download these from the failed **Playwright Tests** run if you want to debug before invoking the Healer.

### K6 load test

Read-only load tests against the Supabase REST API. Results can be viewed in the terminal locally or published to **Grafana Cloud k6** (free tier: 500 virtual user hours/month).

#### One-time Grafana Cloud setup

1. Create a free account at [grafana.com](https://grafana.com/auth/sign-up/create-user) (no credit card).
2. Open **Testing → Performance testing (k6)** in Grafana Cloud.
3. Create a **project** for this repo.
4. From k6 settings, add to this GitHub repo:
   - **Stack API token** → secret `K6_CLOUD_TOKEN`
   - **Project ID** → variable `K6_CLOUD_PROJECT_ID`
   - **Stack ID** → variable `K6_CLOUD_STACK_ID`
5. Reuse existing Supabase secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) and optionally `STAFF_EMAIL` / `STAFF_PASSWORD` for the authenticated scenario.

#### Local run (console only)

Install k6: [k6 install docs](https://grafana.com/docs/k6/latest/set-up/install-k6/)

```bash
k6 run \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_ANON_KEY=eyJ... \
  tests/k6/clinic-load.js
```

With `.env` loaded in your shell:

```bash
npm run test:k6
```

#### Local run + post to Grafana Cloud

```bash
k6 cloud login   # once: paste token and stack ID

k6 cloud run tests/k6/clinic-load.js \
  -e SUPABASE_URL=https://xxx.supabase.co \
  -e SUPABASE_ANON_KEY=eyJ...
```

Or with cloud env vars set:

```bash
npm run test:k6:cloud
```

Open **Grafana Cloud → k6 → your project** to view charts, checks, and threshold pass/fail.

#### CI run

The **K6 Load Test** workflow runs weekly (Sunday 06:00 UTC), on pull requests to `main`, and manually via **Actions → K6 Load Test → Run workflow**. Results stream to Grafana Cloud; PRs get a comment with a link to the test run.

#### What the script exercises

| Scenario | Weight | Auth | Endpoint |
|----------|--------|------|----------|
| Clinic info | 50% | Public | `GET /rest/v1/clinic_info` |
| Patients (no auth) | 30% | Public | `GET /rest/v1/patients` (expects `[]`) |
| Staff list patients | 20% | Staff JWT | `GET /rest/v1/patients` (when staff creds set) |

Load profile: 5 VUs for 30 seconds. Thresholds: `http_req_failed < 1%`, `p(95) < 800ms`.

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
│   ├── deploy-pages.yml         # GitHub Pages deploy
│   ├── playwright.yml           # CI test run
│   ├── playwright-heal.yml        # Self-healing Healer (after failures)
│   ├── playwright-daily-allure.yml
│   └── k6.yml                     # K6 load test → Grafana Cloud
├── docs/SUPABASE_SETUP.md  # Step-by-step backend setup
├── tests/
│   ├── ui/                 # Playwright UI tests
│   ├── api/                # Playwright API tests
│   ├── k6/                 # K6 performance scripts
│   │   ├── lib/            # Shared config and headers
│   │   └── clinic-load.js
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
