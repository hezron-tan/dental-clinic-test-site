import type { APIRequestContext } from '@playwright/test';
import type { ClinicFormData } from '../models';
import { adminEmail, adminPassword, getAccessToken, supabaseHeaders, supabaseUrl } from './supabase';

interface ClinicInfoRow {
  name: string;
  tagline: string | null;
  address: string;
  phone: string;
  email: string;
  hours: string;
}

/**
 * Loads the clinic profile row (`id=1`) from Supabase REST as form-shaped data.
 * Used to snapshot clinic info before admin UI tests mutate it.
 * @param request - Playwright API request context.
 * @returns Clinic form fields mapped from the `clinic_info` row.
 * @throws When the REST request fails.
 */
export async function fetchClinicInfo(request: APIRequestContext): Promise<ClinicFormData> {
  const res = await request.get(
    `${supabaseUrl}/rest/v1/clinic_info?id=eq.1&select=name,tagline,address,phone,email,hours`,
    { headers: supabaseHeaders() }
  );

  if (!res.ok()) {
    throw new Error(`Failed to fetch clinic info (${res.status()}): ${await res.text()}`);
  }

  const row = (await res.json())[0] as ClinicInfoRow;
  return {
    name: row.name,
    tagline: row.tagline ?? undefined,
    address: row.address,
    phone: row.phone,
    email: row.email,
    hours: row.hours
  };
}

/**
 * Writes clinic profile fields back to the `clinic_info` row (`id=1`) via admin JWT.
 * Used after admin UI tests to restore a previously captured snapshot.
 * @param request - Playwright API request context.
 * @param data - Clinic form fields to persist (empty `tagline` is stored as `null`).
 * @throws When the REST request fails.
 */
export async function restoreClinicInfo(
  request: APIRequestContext,
  data: ClinicFormData
): Promise<void> {
  const token = await getAccessToken(adminEmail, adminPassword);
  const res = await request.patch(`${supabaseUrl}/rest/v1/clinic_info?id=eq.1`, {
    headers: supabaseHeaders(token),
    data: {
      name: data.name,
      tagline: data.tagline ?? null,
      address: data.address,
      phone: data.phone,
      email: data.email,
      hours: data.hours
    }
  });

  if (!res.ok()) {
    throw new Error(`Failed to restore clinic info (${res.status()}): ${await res.text()}`);
  }
}
