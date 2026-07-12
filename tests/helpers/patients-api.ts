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

/** Patient created via REST, including the returned row id and form data used. */
export interface CreatedPatient {
  id: string;
  data: PatientFormData;
}

/**
 * Creates a patient via Supabase REST using a staff JWT.
 * @param request - Playwright API request context.
 * @param data - Patient form fields; defaults to {@link buildPatient} when omitted.
 * @returns The created patient id and the form data that was posted.
 * @throws When the REST create request fails.
 */
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

/**
 * Deletes a patient by id via Supabase REST using an admin JWT.
 * @param request - Playwright API request context.
 * @param id - Patient row id to delete.
 * @param token - Optional admin JWT; fetched when omitted.
 * @throws When the REST delete request fails.
 */
export async function deletePatientViaApi(
  request: APIRequestContext,
  id: string,
  token?: string
): Promise<void> {
  const accessToken = token ?? (await getAccessToken(adminEmail, adminPassword));
  const deleteRes = await request.delete(`${supabaseUrl}/rest/v1/patients?id=eq.${id}`, {
    headers: supabaseHeaders(accessToken)
  });

  if (deleteRes.status() >= 300) {
    throw new Error(`Failed to delete patient (${deleteRes.status()}): ${await deleteRes.text()}`);
  }
}

/** Staff JWT used by API tests that need direct REST calls. */
export async function getStaffAccessToken(): Promise<string> {
  return getAccessToken(staffEmail, staffPassword);
}

/**
 * Looks up a patient id by exact first and last name via admin JWT.
 * @param request - Playwright API request context.
 * @param firstName - Patient first name to match.
 * @param lastName - Patient last name to match.
 * @param token - Optional admin JWT; fetched when omitted.
 * @returns The matching patient id, or `null` if none found.
 * @throws When the REST lookup request fails.
 */
export async function findPatientIdByName(
  request: APIRequestContext,
  firstName: string,
  lastName: string,
  token?: string
): Promise<string | null> {
  const accessToken = token ?? (await getAccessToken(adminEmail, adminPassword));
  const res = await request.get(
    `${supabaseUrl}/rest/v1/patients?first_name=eq.${encodeURIComponent(firstName)}&last_name=eq.${encodeURIComponent(lastName)}&select=id&limit=1`,
    { headers: supabaseHeaders(accessToken) }
  );

  if (!res.ok()) {
    throw new Error(`Failed to find patient (${res.status()}): ${await res.text()}`);
  }

  const rows = (await res.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

/**
 * Deletes a patient matched by first/last name when a row exists.
 * No-op if no matching patient is found.
 * @param request - Playwright API request context.
 * @param patient - Form data used to resolve first and last name.
 * @param token - Optional admin JWT reused across batch cleanup.
 */
export async function cleanupPatient(
  request: APIRequestContext,
  patient: PatientFormData,
  token?: string
): Promise<void> {
  const accessToken = token ?? (await getAccessToken(adminEmail, adminPassword));
  const id = await findPatientIdByName(request, patient.firstName, patient.lastName, accessToken);
  if (id) {
    await deletePatientViaApi(request, id, accessToken);
  }
}

/**
 * Deletes each patient in turn by first/last name when a matching row exists.
 * Uses a single admin JWT for the whole batch to avoid auth rate limits.
 * @param request - Playwright API request context.
 * @param patients - Form data entries to resolve and delete.
 */
export async function cleanupPatients(
  request: APIRequestContext,
  patients: PatientFormData[]
): Promise<void> {
  if (patients.length === 0) {
    return;
  }
  const token = await getAccessToken(adminEmail, adminPassword);
  for (const patient of patients) {
    await cleanupPatient(request, patient, token);
  }
}

/** Tracks patients created during UI tests for API cleanup in afterEach. */
export class PatientTracker {
  private readonly patients: PatientFormData[] = [];

  /**
   * Records a patient for later API cleanup.
   * @param patient - Patient form data to track.
   */
  track(patient: PatientFormData): void {
    this.patients.push(patient);
  }

  /**
   * Removes the first tracked patient matching first and last name.
   * @param patient - Patient form data to stop tracking.
   */
  untrack(patient: PatientFormData): void {
    const index = this.patients.findIndex(
      (p) => p.firstName === patient.firstName && p.lastName === patient.lastName
    );
    if (index >= 0) {
      this.patients.splice(index, 1);
    }
  }

  /**
   * Deletes all currently tracked patients via API, then clears the list.
   * @param request - Playwright API request context.
   */
  async cleanup(request: APIRequestContext): Promise<void> {
    const pending = [...this.patients];
    this.patients.length = 0;
    await cleanupPatients(request, pending);
  }
}
