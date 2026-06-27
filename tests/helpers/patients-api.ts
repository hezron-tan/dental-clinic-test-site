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
