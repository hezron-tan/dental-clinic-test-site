import type { APIRequestContext } from '@playwright/test';
import type { PatientFormData } from '../models';
import {
  adminEmail,
  adminPassword,
  getAccessToken,
  requireCredentials,
  staffEmail,
  staffPassword,
  supabaseHeaders,
  supabaseUrl
} from './supabase';
import { buildPatient, toApiPatient } from './test-data';

export interface CreatedPatient {
  id: string;
  data: PatientFormData;
}

export async function createPatientViaApi(
  request: APIRequestContext,
  data: PatientFormData = buildPatient()
): Promise<CreatedPatient> {
  const { email, password } = requireCredentials('staff');
  const token = await getAccessToken(email, password);

  const createRes = await request.post(`${supabaseUrl}/rest/v1/patients`, {
    headers: {
      ...supabaseHeaders(token),
      Prefer: 'return=representation'
    },
    data: toApiPatient(data)
  });

  if (!createRes.ok()) {
    throw new Error(`Failed to create patient (${createRes.status()}): ${await createRes.text()}`);
  }

  const created = (await createRes.json())[0];
  return { id: created.id as string, data };
}

export async function deletePatientViaApi(request: APIRequestContext, id: string): Promise<void> {
  const token = await getAccessToken(adminEmail, adminPassword);
  const deleteRes = await request.delete(`${supabaseUrl}/rest/v1/patients?id=eq.${id}`, {
    headers: supabaseHeaders(token)
  });

  if (deleteRes.status() >= 300) {
    throw new Error(`Failed to delete patient (${deleteRes.status()}): ${await deleteRes.text()}`);
  }
}

/** Staff JWT used by API tests that need direct REST calls. */
export async function getStaffAccessToken(): Promise<string> {
  return getAccessToken(staffEmail, staffPassword);
}

export async function findPatientIdByName(
  request: APIRequestContext,
  firstName: string,
  lastName: string
): Promise<string | null> {
  const token = await getAccessToken(adminEmail, adminPassword);
  const res = await request.get(
    `${supabaseUrl}/rest/v1/patients?first_name=eq.${encodeURIComponent(firstName)}&last_name=eq.${encodeURIComponent(lastName)}&select=id&limit=1`,
    { headers: supabaseHeaders(token) }
  );

  if (!res.ok()) {
    throw new Error(`Failed to find patient (${res.status()}): ${await res.text()}`);
  }

  const rows = (await res.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

export async function cleanupPatient(
  request: APIRequestContext,
  patient: PatientFormData
): Promise<void> {
  const id = await findPatientIdByName(request, patient.firstName, patient.lastName);
  if (id) {
    await deletePatientViaApi(request, id);
  }
}

export async function cleanupPatients(
  request: APIRequestContext,
  patients: PatientFormData[]
): Promise<void> {
  for (const patient of patients) {
    await cleanupPatient(request, patient);
  }
}

/** Tracks patients created during UI tests for API cleanup in afterEach. */
export class PatientTracker {
  private readonly patients: PatientFormData[] = [];

  track(patient: PatientFormData): void {
    this.patients.push(patient);
  }

  untrack(patient: PatientFormData): void {
    const index = this.patients.findIndex(
      (p) => p.firstName === patient.firstName && p.lastName === patient.lastName
    );
    if (index >= 0) {
      this.patients.splice(index, 1);
    }
  }

  async cleanup(request: APIRequestContext): Promise<void> {
    const pending = [...this.patients];
    this.patients.length = 0;
    await cleanupPatients(request, pending);
  }
}
