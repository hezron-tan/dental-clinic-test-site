import { expect, test } from '@playwright/test';
import {
  getAccessToken,
  hasAdminCredentials,
  requireCredentials,
  requireSupabaseEnv,
  staffEmail,
  staffPassword,
  supabaseAnonKey,
  supabaseHeaders,
  supabaseUrl
} from '../helpers/supabase';
import { buildPatient } from '../helpers/test-data';
import { createPatientViaApi, deletePatientViaApi, getStaffAccessToken } from '../helpers/patients-api';

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

  test('staff can create a patient but not delete via REST', async ({ request }) => {
    test.skip(!hasAdminCredentials(), 'Set ADMIN_PASSWORD in .env for test cleanup');

    const patient = buildPatient();
    const { id, data } = await createPatientViaApi(request, patient);

    expect(data.lastName).toBe(patient.lastName);

    const staffToken = await getStaffAccessToken();
    const deleteRes = await request.delete(`${supabaseUrl}/rest/v1/patients?id=eq.${id}`, {
      headers: supabaseHeaders(staffToken)
    });

    // PostgREST returns 204 even when RLS blocks the delete (0 rows affected).
    expect(deleteRes.status()).toBeLessThan(300);

    const verifyRes = await request.get(`${supabaseUrl}/rest/v1/patients?id=eq.${id}&select=id`, {
      headers: supabaseHeaders(staffToken)
    });
    expect(verifyRes.ok()).toBeTruthy();
    expect(await verifyRes.json()).toHaveLength(1);

    await deletePatientViaApi(request, id);
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
