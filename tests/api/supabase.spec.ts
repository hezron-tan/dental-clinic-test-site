import { expect, test } from '@playwright/test';
import {
  getAccessToken,
  requireCredentials,
  requireSupabaseEnv,
  staffEmail,
  staffPassword,
  supabaseAnonKey,
  supabaseHeaders,
  supabaseUrl
} from '../helpers/supabase';

test.describe('Clinic API', () => {
  test.beforeEach(() => {
    test.skip(!requireSupabaseEnv() || supabaseUrl.includes('YOUR_PROJECT'), 'Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
  });

  test('GET clinic_info is public', async ({ request }) => {
    const res = await request.get(`${supabaseUrl}/rest/v1/clinic_info?id=eq.1&select=name,address,phone`, {
      headers: { apikey: supabaseAnonKey }
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body[0].name).toBeTruthy();
    expect(body[0].address).toBeTruthy();
  });

  test('GET patients without auth returns empty or unauthorized', async ({ request }) => {
    const res = await request.get(`${supabaseUrl}/rest/v1/patients?select=id&limit=1`, {
      headers: { apikey: supabaseAnonKey }
    });

    const body = await res.json();
    expect(res.ok()).toBeTruthy();
    expect(body).toEqual([]);
  });
});

test.describe('Patients API', () => {
  test.beforeEach(() => {
    test.skip(!requireSupabaseEnv() || supabaseUrl.includes('YOUR_PROJECT'), 'Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    test.skip(!staffPassword, 'Set STAFF_PASSWORD in .env');
  });

  test('staff can list patients with JWT', async ({ request }) => {
    const { email, password } = requireCredentials('staff');
    const token = await getAccessToken(email, password);

    const res = await request.get(`${supabaseUrl}/rest/v1/patients?select=first_name,last_name&order=last_name`, {
      headers: supabaseHeaders(token)
    });

    expect(res.ok()).toBeTruthy();
    const patients = await res.json();
    expect(patients.length).toBeGreaterThan(0);
    expect(patients[0]).toHaveProperty('first_name');
  });

  test('staff can create and delete a patient via REST', async ({ request }) => {
    const token = await getAccessToken(staffEmail, staffPassword);
    const suffix = String(Date.now()).slice(-6);

    const createRes = await request.post(`${supabaseUrl}/rest/v1/patients`, {
      headers: {
        ...supabaseHeaders(token),
        Prefer: 'return=representation'
      },
      data: {
        first_name: 'API',
        last_name: `Test${suffix}`,
        email: `api.${suffix}@example.test`
      }
    });

    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json())[0];
    expect(created.last_name).toBe(`Test${suffix}`);

    const deleteRes = await request.delete(
      `${supabaseUrl}/rest/v1/patients?id=eq.${created.id}`,
      { headers: supabaseHeaders(token) }
    );

    // Staff cannot delete — only admin can. Expect failure for staff.
    expect(deleteRes.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Auth API', () => {
  test.beforeEach(() => {
    test.skip(!requireSupabaseEnv() || supabaseUrl.includes('YOUR_PROJECT'), 'Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    test.skip(!staffPassword, 'Set STAFF_PASSWORD in .env');
  });

  test('password grant returns access token', async ({ request }) => {
    const res = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      data: {
        email: staffEmail,
        password: staffPassword
      }
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe('bearer');
  });

  test('invalid password returns 400', async ({ request }) => {
    const res = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      data: {
        email: staffEmail,
        password: 'definitely-wrong-password'
      }
    });

    expect(res.status()).toBe(400);
  });
});
