import { faker } from '@faker-js/faker';
import type { ClinicFormData, PatientFormData, VisitHistoryFormData } from '../models';

const DENTAL_PROCEDURES = [
  'Checkup',
  'Cleaning',
  'Filling',
  'Extraction',
  'Root Canal',
  'Crown',
  'X-Ray',
  'Other'
] as const;

const CATCHPHRASES = [
  'Your smile, our priority',
  'Gentle care for every patient',
  'Healthy teeth, happy life'
] as const;

faker.seed(Date.now());

/** Set a fixed seed when you need reproducible values (e.g. debugging a flaky test). */
export function seedFaker(nextSeed: number): void {
  faker.seed(nextSeed);
}

function portlandStreetAddress(): string {
  return `${faker.location.streetAddress()}, Portland, OR`;
}

/** Matches the Portland clinic phone format used in seed data. */
export function portlandPhone(): string {
  return `(503) 555-${faker.string.numeric(4)}`;
}

/** Safe test-only email domain (RFC 2606). */
export function testEmail(prefix = 'patient'): string {
  return `${prefix}.${faker.string.alphanumeric(6).toLowerCase()}@example.test`;
}

/** Maps form data to the Supabase REST API patient shape. */
export function toApiPatient(data: PatientFormData) {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null
  };
}

/** Substring used to locate a patient row in the dashboard table. */
export function patientRowMatch(patient: PatientFormData): string {
  return `${patient.lastName}, ${patient.firstName}`;
}

/** Name query for the search form (matches first or last name fields). */
export function patientSearchQuery(patient: PatientFormData): string {
  return patient.lastName;
}

/** Derives a search query from a table row label such as "Last, First". */
export function searchQueryFromRowLabel(rowLabel: string): string {
  const [lastName] = rowLabel.split(',');
  return lastName.trim();
}

/** Converts an ISO date (yyyy-mm-dd) to the dd/mm/yyyy format used by staff search. */
export function toSearchDateOfBirth(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function randomBirthDate(): string {
  return faker.date
    .birthdate({ min: 18, max: 85, mode: 'age' })
    .toISOString()
    .slice(0, 10);
}

/** ISO birth date unlikely to exist in seed data or collide across parallel tests. */
export function uniqueBirthDate(): string {
  const n = Date.now() + faker.number.int({ max: 1_000_000 });
  const day = 1 + (n % 28);
  const month = 1 + (Math.floor(n / 28) % 12);
  const year = 2090 + (Math.floor(n / (28 * 12)) % 9);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function recentVisitDate(): string {
  return faker.date.recent({ days: 30 }).toISOString().slice(0, 10);
}

/**
 * Builds patient form data with random defaults.
 * Pass fields in `overrides` to replace specific values.
 */
export function buildPatient(overrides: Partial<PatientFormData> = {}): PatientFormData {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dateOfBirth: randomBirthDate(),
    email: testEmail('patient'),
    phone: portlandPhone(),
    address: portlandStreetAddress(),
    ...overrides
  };
}

/**
 * Builds visit history form data with random defaults.
 * Pass fields in `overrides` to replace specific values.
 */
export function buildVisitHistory(overrides: Partial<VisitHistoryFormData> = {}): VisitHistoryFormData {
  return {
    visitDate: recentVisitDate(),
    procedure: faker.helpers.arrayElement(DENTAL_PROCEDURES),
    description: 'Routine follow-up visit.',
    dentist: `Dr. ${faker.person.lastName()}`,
    ...overrides
  };
}

/**
 * Builds clinic profile form data with random defaults.
 * Pass fields in `overrides` to replace specific values.
 */
export function buildClinicUpdate(overrides: Partial<ClinicFormData> = {}): ClinicFormData {
  return {
    tagline: faker.helpers.arrayElement(CATCHPHRASES),
    address: portlandStreetAddress(),
    phone: portlandPhone(),
    email: testEmail('clinic'),
    hours: 'Mon–Fri 8:00–17:00',
    ...overrides
  };
}
