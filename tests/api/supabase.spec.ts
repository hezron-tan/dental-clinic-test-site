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
import { buildDoctor, buildPatient, SEED_DOCTOR_NAMES } from '../helpers/test-data';
import { createPatientViaApi, deletePatientViaApi, getStaffAccessToken } from '../helpers/patients-api';
import {
  createDoctorViaApi,
  deleteDoctorViaApi,
  findDoctorIdByName
} from '../helpers/doctors-api';

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

test.describe('Doctors API', () => {
  test.beforeEach(() => {
    test.skip(!requireSupabaseEnv() || supabaseUrl.includes('YOUR_PROJECT'), 'Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
  });

  test('GET doctors is public and includes seed doctors', async ({ request }) => {
    const res = await request.get(`${supabaseUrl}/rest/v1/doctors?select=id,name&order=name`, {
      headers: { apikey: supabaseAnonKey }
    });

    expect(res.ok()).toBeTruthy();
    const doctors = (await res.json()) as { id: string; name: string }[];
    expect(doctors.length).toBeGreaterThanOrEqual(SEED_DOCTOR_NAMES.length);

    const names = doctors.map((d) => d.name);
    for (const seedName of SEED_DOCTOR_NAMES) {
      expect(names).toContain(seedName);
    }
  });

  test('admin can create, update, and delete a doctor without removing seed doctors', async ({ request }) => {
    test.skip(!hasAdminCredentials(), 'Set ADMIN_PASSWORD in .env');

    const doctor = buildDoctor();
    const { id, data } = await createDoctorViaApi(request, doctor);
    expect(data.name).toBe(doctor.name);

    const { email, password } = requireCredentials('admin');
    const adminToken = await getAccessToken(email, password);
    const updatedDescription = 'Updated via Playwright API test.';

    const updateRes = await request.patch(`${supabaseUrl}/rest/v1/doctors?id=eq.${id}`, {
      headers: {
        ...supabaseHeaders(adminToken),
        Prefer: 'return=representation'
      },
      data: { description: updatedDescription }
    });
    expect(updateRes.ok()).toBeTruthy();
    const [updated] = await updateRes.json();
    expect(updated.description).toBe(updatedDescription);

    await deleteDoctorViaApi(request, id, adminToken);

    const gone = await findDoctorIdByName(request, doctor.name, adminToken);
    expect(gone).toBeNull();

    for (const seedName of SEED_DOCTOR_NAMES) {
      const seedId = await findDoctorIdByName(request, seedName, adminToken);
      expect(seedId).toBeTruthy();
    }
  });

  test('staff cannot create or delete doctors via REST', async ({ request }) => {
    test.skip(!staffPassword, 'Set STAFF_PASSWORD in .env');
    test.skip(!hasAdminCredentials(), 'Set ADMIN_PASSWORD in .env for cleanup and seed checks');

    const staffToken = await getStaffAccessToken();
    const doctor = buildDoctor();

    const createRes = await request.post(`${supabaseUrl}/rest/v1/doctors`, {
      headers: {
        ...supabaseHeaders(staffToken),
        Prefer: 'return=representation'
      },
      data: { name: doctor.name, description: doctor.description ?? null }
    });

    // PostgREST may return 201 with [] or an error when RLS blocks insert.
    if (createRes.ok()) {
      expect(await createRes.json()).toEqual([]);
    } else {
      expect(createRes.status()).toBeGreaterThanOrEqual(400);
    }

    expect(await findDoctorIdByName(request, doctor.name)).toBeNull();

    const seedId = await findDoctorIdByName(request, SEED_DOCTOR_NAMES[0]);
    expect(seedId).toBeTruthy();

    const deleteRes = await request.delete(`${supabaseUrl}/rest/v1/doctors?id=eq.${seedId}`, {
      headers: supabaseHeaders(staffToken)
    });
    expect(deleteRes.status()).toBeLessThan(300);

    const stillThere = await findDoctorIdByName(request, SEED_DOCTOR_NAMES[0]);
    expect(stillThere).toBe(seedId);
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
