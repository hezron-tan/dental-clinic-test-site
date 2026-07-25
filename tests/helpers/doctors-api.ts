import type { APIRequestContext } from '@playwright/test';
import type { DoctorFormData } from '../models';
import {
  adminEmail,
  adminPassword,
  getAccessToken,
  requireCredentials,
  supabaseHeaders,
  supabaseUrl
} from './supabase';
import { buildDoctor, isSeedDoctorName, toApiDoctor } from './test-data';

/** Doctor created via REST, including the returned row id and form data used. */
export interface CreatedDoctor {
  id: string;
  data: DoctorFormData;
}

/**
 * Creates a doctor via Supabase REST using an admin JWT.
 * @param request - Playwright API request context.
 * @param data - Doctor form fields; defaults to {@link buildDoctor} when omitted.
 * @returns The created doctor id and the form data that was posted.
 * @throws When the REST create request fails.
 */
export async function createDoctorViaApi(
  request: APIRequestContext,
  data: DoctorFormData = buildDoctor()
): Promise<CreatedDoctor> {
  const { email, password } = requireCredentials('admin');
  const token = await getAccessToken(email, password);

  const createRes = await request.post(`${supabaseUrl}/rest/v1/doctors`, {
    headers: {
      ...supabaseHeaders(token),
      Prefer: 'return=representation'
    },
    data: toApiDoctor(data)
  });

  if (!createRes.ok()) {
    throw new Error(`Failed to create doctor (${createRes.status()}): ${await createRes.text()}`);
  }

  const created = (await createRes.json())[0];
  return { id: created.id as string, data };
}

/**
 * Deletes a doctor by id via Supabase REST using an admin JWT.
 * Refuses to delete when the row's name matches a seed doctor.
 * @param request - Playwright API request context.
 * @param id - Doctor row id to delete.
 * @param token - Optional admin JWT; fetched when omitted.
 * @throws When the doctor is a seed doctor, or the REST delete request fails.
 */
export async function deleteDoctorViaApi(
  request: APIRequestContext,
  id: string,
  token?: string
): Promise<void> {
  const accessToken = token ?? (await getAccessToken(adminEmail, adminPassword));

  const lookupRes = await request.get(
    `${supabaseUrl}/rest/v1/doctors?id=eq.${id}&select=id,name&limit=1`,
    { headers: supabaseHeaders(accessToken) }
  );
  if (!lookupRes.ok()) {
    throw new Error(`Failed to look up doctor before delete (${lookupRes.status()}): ${await lookupRes.text()}`);
  }
  const rows = (await lookupRes.json()) as { id: string; name: string }[];
  const row = rows[0];
  if (!row) {
    return;
  }
  if (isSeedDoctorName(row.name)) {
    throw new Error(`Refusing to delete seed doctor "${row.name}" (${id})`);
  }

  const deleteRes = await request.delete(`${supabaseUrl}/rest/v1/doctors?id=eq.${id}`, {
    headers: supabaseHeaders(accessToken)
  });

  if (deleteRes.status() >= 300) {
    throw new Error(`Failed to delete doctor (${deleteRes.status()}): ${await deleteRes.text()}`);
  }
}

/**
 * Looks up a doctor id by exact display name via admin JWT.
 * @param request - Playwright API request context.
 * @param name - Exact doctor display name to match.
 * @param token - Optional admin JWT; fetched when omitted.
 * @returns The matching doctor id, or `null` if none found.
 * @throws When the REST lookup request fails.
 */
export async function findDoctorIdByName(
  request: APIRequestContext,
  name: string,
  token?: string
): Promise<string | null> {
  const accessToken = token ?? (await getAccessToken(adminEmail, adminPassword));
  const res = await request.get(
    `${supabaseUrl}/rest/v1/doctors?name=eq.${encodeURIComponent(name)}&select=id&limit=1`,
    { headers: supabaseHeaders(accessToken) }
  );

  if (!res.ok()) {
    throw new Error(`Failed to find doctor (${res.status()}): ${await res.text()}`);
  }

  const rows = (await res.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

/**
 * Deletes a doctor matched by exact name when a row exists.
 * No-op if no matching doctor is found. Never deletes seed doctors.
 * @param request - Playwright API request context.
 * @param doctor - Form data used to resolve the display name.
 * @param token - Optional admin JWT reused across batch cleanup.
 * @throws When `doctor.name` is a seed doctor name.
 */
export async function cleanupDoctor(
  request: APIRequestContext,
  doctor: DoctorFormData,
  token?: string
): Promise<void> {
  if (isSeedDoctorName(doctor.name)) {
    throw new Error(`Refusing to clean up seed doctor "${doctor.name}"`);
  }
  const accessToken = token ?? (await getAccessToken(adminEmail, adminPassword));
  const id = await findDoctorIdByName(request, doctor.name, accessToken);
  if (id) {
    await deleteDoctorViaApi(request, id, accessToken);
  }
}

/**
 * Deletes each doctor in turn by exact name when a matching row exists.
 * Uses a single admin JWT for the whole batch to avoid auth rate limits.
 * @param request - Playwright API request context.
 * @param doctors - Form data entries to resolve and delete.
 */
export async function cleanupDoctors(
  request: APIRequestContext,
  doctors: DoctorFormData[]
): Promise<void> {
  if (doctors.length === 0) {
    return;
  }
  const token = await getAccessToken(adminEmail, adminPassword);
  for (const doctor of doctors) {
    await cleanupDoctor(request, doctor, token);
  }
}

/** Tracks doctors created during UI tests for API cleanup in afterEach. */
export class DoctorTracker {
  private readonly doctors: DoctorFormData[] = [];

  /**
   * Records a doctor for later API cleanup.
   * @param doctor - Doctor form data to track.
   * @throws When `doctor.name` is a seed doctor name.
   */
  track(doctor: DoctorFormData): void {
    if (isSeedDoctorName(doctor.name)) {
      throw new Error(`Refusing to track seed doctor "${doctor.name}" for deletion`);
    }
    this.doctors.push(doctor);
  }

  /**
   * Removes the first tracked doctor matching the exact display name.
   * @param doctor - Doctor form data to stop tracking.
   */
  untrack(doctor: DoctorFormData): void {
    const index = this.doctors.findIndex((d) => d.name === doctor.name);
    if (index >= 0) {
      this.doctors.splice(index, 1);
    }
  }

  /**
   * Deletes all currently tracked doctors via API, then clears the list.
   * @param request - Playwright API request context.
   */
  async cleanup(request: APIRequestContext): Promise<void> {
    const pending = [...this.doctors];
    this.doctors.length = 0;
    await cleanupDoctors(request, pending);
  }
}
