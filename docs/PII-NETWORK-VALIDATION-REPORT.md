# PII Network Validation Report

**Target:** [https://hezron-tan.github.io/dental-clinic-test-site/](https://hezron-tan.github.io/dental-clinic-test-site/)  
**Backend:** `https://vvzskurmphdfbobbnbso.supabase.co`  
**Method:** Chrome DevTools MCP — network capture across public homepage, staff login, patient list, and patient detail / visit history  
**Date:** 2026-08-01  
**Scope note:** This is a practice/test clinic with synthetic patient data. Findings still map to how real PII/PHI would appear in production.

---

## Executive summary

Authenticated staff traffic correctly requires a JWT (RLS blocks anonymous reads of `patients` / `patient_history`). However, once logged in, the app **over-fetches full patient PII for all 231 records** in a single `select=*`, stores the **session JWT in `localStorage`**, and sends the **password in the login request body** (visible in DevTools). Visit history responses include clinical procedure details.

| Risk | Count |
|------|------:|
| High | 4 |
| Medium | 4 |
| Low | 3 |

---

## Flows exercised

| Flow | Key requests observed |
|------|------------------------|
| Public homepage | `GET /rest/v1/clinic_info?select=*&id=eq.1` |
| Staff login | `POST /auth/v1/token?grant_type=password` |
| Staff dashboard | `GET /rest/v1/profiles?...`, `GET /rest/v1/patients?select=*&order=last_name.asc` |
| Patient detail | `GET /rest/v1/patients?select=*&id=eq.…`, `GET /rest/v1/patient_history?select=*&patient_id=eq.…` |
| Anon probe (JS fetch) | `patients` → `[]`, `patient_history` → `[]`, `doctors` → 3 public rows |

---

## Findings

### HIGH-01 — Full patient roster downloaded with all PII columns

| Field | Value |
|-------|--------|
| **Risk** | High |
| **Endpoint** | `GET /rest/v1/patients?select=*&order=last_name.asc` |
| **Evidence** | `content-range: 0-230/*` (231 rows). Response includes `first_name`, `last_name`, `date_of_birth`, `email`, `phone`, `address`, `emergency_contact_*`, `notes`. UI paginates client-side (`PAGE_SIZE = 10` in `js/staff-dashboard.js`) after loading the full set. |
| **PII types** | Name, DOB, email, phone, postal address, emergency contacts, free-text notes |

**Why it matters:** Any XSS, malicious extension, compromised staff session, or shoulder-surfing of DevTools exposes the entire patient database—not just the visible page.

**Fix / mitigate**

1. Server-side pagination: `.range(from, to)` / PostgREST `Limit`/`Offset` instead of loading all rows.
2. List projection: `select=id,first_name,last_name,date_of_birth,email,phone` for the table; fetch address / emergency / notes only on detail view.
3. Prefer search-driven queries so full dumps are not the default path.

---

### HIGH-02 — Password sent in clear JSON in login request body

| Field | Value |
|-------|--------|
| **Risk** | High |
| **Endpoint** | `POST /auth/v1/token?grant_type=password` |
| **Evidence** | Request body shape: `{"email":"staff@clinic.test","password":"<plaintext>","gotrue_meta_security":{}}`. Visible in Chrome Network panel. Transit is HTTPS. |
| **PII types** | Credentials (email + password) |

**Why it matters:** HTTPS protects the wire, but the body is readable by DevTools, browser extensions, corporate proxies that terminate TLS, and XSS that hooks `fetch`/`XMLHttpRequest`. Weak documented test passwords increase likelihood of abuse on the public Pages deploy.

**Fix / mitigate**

1. Keep HTTPS-only (already true on Supabase).
2. Rotate away from shared/default passwords; use strong unique secrets; enforce MFA for any non-demo environment.
3. Prefer magic-link / OAuth / WebAuthn where practical to avoid password bodies.
4. Short session TTL + refresh rotation; revoke sessions on password change.
5. Do not log request bodies in APM, proxies, or custom analytics.

---

### HIGH-03 — Auth session JWT stored in `localStorage`

| Field | Value |
|-------|--------|
| **Risk** | High |
| **Evidence** | Key `sb-vvzskurmphdfbobbnbso-auth-token` in `localStorage` contains `access_token` (and related session fields). Same JWT reused as `Authorization: Bearer …` on patient APIs. |
| **PII types** | Session token; JWT payload includes `email` (`staff@clinic.test`), `sub` (user id), `session_id` |

**Why it matters:** Any XSS can read `localStorage` and exfiltrate a bearer token that unlocks all patient PII/PHI until expiry.

**Fix / mitigate**

1. Prefer httpOnly, Secure, SameSite cookies for session (Supabase SSR / custom auth cookie pattern) so JS cannot read the token.
2. Add a strict Content-Security-Policy (GitHub Pages HTML currently has no CSP) to reduce XSS impact.
3. Short-lived access tokens; refresh token rotation; idle timeout.
4. Avoid putting email in client-visible claims if not required.

---

### HIGH-04 — Clinical visit history (PHI-like) over the network

| Field | Value |
|-------|--------|
| **Risk** | High |
| **Endpoint** | `GET /rest/v1/patient_history?select=*&patient_id=eq.…` |
| **Evidence** | Example fields: `visit_date`, `procedure_type` (e.g. Extraction), `description`, `dentist_name`, `patient_id`, `created_by`. |
| **PII types** | Health/treatment data linked to a patient UUID (PHI-class if real) |

**Why it matters:** Procedure and clinical notes are sensitive even when names are not repeated in the history row—the `patient_id` joins to full identity via prior calls.

**Fix / mitigate**

1. Field-level minimization: omit unused columns; separate “clinical notes” into a higher-privilege view if roles differ.
2. Audit logging for history reads/writes.
3. Encrypt sensitive note fields at rest (application-level) if moving beyond demo data.
4. Ensure RLS remains staff/admin-only (currently correct for anon).

---

### MEDIUM-01 — JWT email claim on every authenticated API call

| Field | Value |
|-------|--------|
| **Risk** | Medium |
| **Evidence** | Decoded JWT in `Authorization` header includes `"email":"staff@clinic.test"`. Sent on profiles, patients, and history requests. |
| **PII types** | Staff email |

**Fix / mitigate:** Minimize JWT claims; rely on `sub` + server-side profile lookup; avoid logging Authorization headers.

---

### MEDIUM-02 — Public Supabase anon key in `js/config.js`

| Field | Value |
|-------|--------|
| **Risk** | Medium |
| **Evidence** | `https://hezron-tan.github.io/dental-clinic-test-site/js/config.js` exposes `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Anon key is also sent as `apikey` / `Authorization` on public `clinic_info` calls. |
| **PII types** | Not PII itself; enables unauthenticated API access within RLS |

**Why it matters:** Expected for Supabase SPA architecture, but any RLS mistake becomes a public data breach. Anon probe confirmed `patients` / `patient_history` return `[]` today.

**Fix / mitigate**

1. Treat RLS as the primary control; add automated RLS regression tests (already partially covered in `tests/api`).
2. Restrict CORS origins (Supabase already returns `access-control-allow-origin: https://hezron-tan.github.io` for API).
3. Never ship the **service role** key to the frontend.
4. Rate-limit auth and REST via Supabase dashboard / WAF if abused.

---

### MEDIUM-03 — No Content-Security-Policy on GitHub Pages HTML

| Field | Value |
|-------|--------|
| **Risk** | Medium |
| **Evidence** | `GET …/staff/` response headers include cache/`server: GitHub.com` but no `content-security-policy`. |
| **PII types** | Indirect — raises impact of XSS against `localStorage` tokens and PII in DOM |

**Fix / mitigate:** Add CSP via meta tag or Pages/_headers (where supported), or host behind a CDN that injects CSP; disallow inline scripts where possible; use nonces.

---

### MEDIUM-04 — Doctors table world-readable

| Field | Value |
|-------|--------|
| **Risk** | Medium |
| **Endpoint** | `GET /rest/v1/doctors?select=*` (anon) |
| **Evidence** | Schema policy `"Anyone can read doctors"`. Anon fetch returned 3 doctors with names, descriptions, and public avatar URLs. |
| **PII types** | Practitioner names / bios / images |

**Fix / mitigate:** If doctors should not be public, change RLS to `is_staff_or_admin()`. Keep avatars in a non-public bucket if needed. For a marketing site, public bios may be intentional—document that choice.

---

### LOW-01 — Public clinic contact details

| Field | Value |
|-------|--------|
| **Risk** | Low |
| **Endpoint** | `GET /rest/v1/clinic_info?select=*&id=eq.1` |
| **Evidence** | Response includes `address`, `phone`, `email` (business contact). Policy: `"Anyone can read clinic info"`. |
| **PII types** | Business contact (often intentional) |

**Fix / mitigate:** Keep if intended for the public site. Avoid putting personal staff home addresses here. Consider a published “public” view without internal-only fields.

---

### LOW-02 — Patient PII rendered in staff UI / DOM

| Field | Value |
|-------|--------|
| **Risk** | Low *(expected for authorized staff; residual shoulder-surf / XSS risk)* |
| **Evidence** | Patient table shows name, DOB, phone, email. Detail dialog shows address and visit history. |

**Fix / mitigate:** Mask DOB/phone in list views; blur on idle; auto-lock dashboard; avoid leaving DevTools open on shared machines.

---

### LOW-03 — Cloudflare `__cf_bm` cookie on Supabase host

| Field | Value |
|-------|--------|
| **Risk** | Low |
| **Evidence** | `Set-Cookie: __cf_bm=…; HttpOnly; SameSite=None; Secure; Domain=supabase.co` |
| **PII types** | Bot-management cookie (not patient PII) |

**Fix / mitigate:** No action required for PII; ensure first-party cookies for auth (if adopted) also use `Secure` + appropriate `SameSite`.

---

## Positive controls observed

| Control | Result |
|---------|--------|
| TLS to Supabase | HTTPS on all API calls |
| Patient RLS (anon) | `GET /patients` with anon key → `200` + `[]` |
| History RLS (anon) | `GET /patient_history` with anon key → `200` + `[]` |
| Supabase HSTS | `strict-transport-security: max-age=31536000; includeSubDomains; preload` |
| API CORS | `access-control-allow-origin: https://hezron-tan.github.io` (not `*`) for REST |

---

## PII inventory by network surface

| Data element | Where seen | Auth required | Risk if leaked |
|--------------|------------|---------------|----------------|
| Patient name | `/patients` list & detail | Staff/admin | High |
| Date of birth | `/patients` | Staff/admin | High |
| Email / phone | `/patients` | Staff/admin | High |
| Home address | `/patients` (`select=*`) | Staff/admin | High |
| Emergency contact | `/patients` columns (when populated) | Staff/admin | High |
| Clinical notes / procedures | `/patient_history` | Staff/admin | High |
| Staff email | Login body, JWT, UI greeting | Login | Medium |
| Staff password | Login request body | N/A (submitted) | High |
| Session JWT | `localStorage` + `Authorization` | After login | High |
| Clinic address/phone/email | `/clinic_info` public | No | Low |
| Doctor name / photo URL | `/doctors` public | No | Medium |
| Anon API key | `js/config.js` + headers | No | Medium (gateway) |

---

## Recommended priority order

1. **Paginate + project** patient list queries (HIGH-01).  
2. **Move session out of `localStorage`** and add CSP (HIGH-03, MEDIUM-03).  
3. **Harden auth** (password policy / MFA / no shared demo secrets on public deploy) (HIGH-02).  
4. **Minimize history payloads** and add read audit trails (HIGH-04).  
5. Revisit **public doctors** RLS and keep anon-key + RLS tests in CI (MEDIUM-02, MEDIUM-04).

---

## Appendix — Sample request map (redacted)

```
Public:
  GET  /rest/v1/clinic_info?select=*&id=eq.1

Auth:
  POST /auth/v1/token?grant_type=password
       body: { email, password }          ← credential PII

Staff session:
  GET  /rest/v1/profiles?select=id,role,display_name&id=eq.<user-uuid>
  GET  /rest/v1/patients?select=*&order=last_name.asc
       ← 231 rows × full PII columns

Detail:
  GET  /rest/v1/patients?select=*&id=eq.<patient-uuid>
  GET  /rest/v1/patient_history?select=*&patient_id=eq.<patient-uuid>&order=visit_date.desc
```

Tokens, full passwords, and complete patient dumps are omitted from this document on purpose. Re-capture via Chrome DevTools Network if needed for remediation verification.
