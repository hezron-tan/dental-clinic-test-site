import path from 'node:path';
import { faker } from '@faker-js/faker';
import type { ClinicFormData, DoctorFormData, PatientFormData, VisitHistoryFormData } from '../models';

/**
 * Seeded doctor display names from `supabase/seed.sql`.
 * Tests must never delete these rows — only doctors created in the test.
 */
export const SEED_DOCTOR_NAMES = [
  'Dr. Emily Smith',
  'Dr. James Park',
  'Dr. Sarah Nguyen'
] as const;

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
 * Dentist is omitted by default — the staff form uses a doctors dropdown.
 * Pass `dentist` as an exact doctor name from the list when needed.
 * Pass fields in `overrides` to replace specific values.
 */
export function buildVisitHistory(overrides: Partial<VisitHistoryFormData> = {}): VisitHistoryFormData {
  return {
    visitDate: recentVisitDate(),
    procedure: faker.helpers.arrayElement(DENTAL_PROCEDURES),
    description: 'Routine follow-up visit.',
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

/**
 * Absolute path to a doctor avatar PNG under `tests/fixtures/doctors/`.
 * @param filename - File name such as `dr-emily-smith-solo.png`.
 * @returns Absolute filesystem path for Playwright `setInputFiles`.
 */
export function doctorFixturePath(filename: string): string {
  return path.join(process.cwd(), 'tests', 'fixtures', 'doctors', filename);
}

/**
 * Builds doctor form data with a unique name that will not match seed doctors.
 * Pass fields in `overrides` to replace specific values.
 * @param overrides - Optional field replacements.
 */
export function buildDoctor(overrides: Partial<DoctorFormData> = {}): DoctorFormData {
  const unique = faker.string.alphanumeric(6).toLowerCase();
  return {
    name: `Dr. ${faker.person.firstName()} ${faker.person.lastName()} ${unique}`,
    description: faker.lorem.sentence(),
    ...overrides
  };
}

/**
 * Maps form data to the Supabase REST API doctor shape (no file upload).
 * @param data - Doctor form fields.
 */
export function toApiDoctor(data: DoctorFormData) {
  return {
    name: data.name,
    description: data.description ?? null
  };
}

/**
 * True when `name` matches a seeded doctor from {@link SEED_DOCTOR_NAMES}.
 * @param name - Doctor display name to check.
 */
export function isSeedDoctorName(name: string): boolean {
  return (SEED_DOCTOR_NAMES as readonly string[]).includes(name);
}
