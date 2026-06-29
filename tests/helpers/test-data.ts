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
];

let seed = Date.now();
faker.seed(seed);

/** Set a fixed seed when you need reproducible values (e.g. debugging a flaky test). */
export function seedFaker(nextSeed: number): void {
  seed = nextSeed;
  faker.seed(nextSeed);
}

function portlandStreetAddress(): string {
  return `${faker.location.streetAddress()}, Portland, OR`;
}

function nextRandom(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(nextRandom() * items.length)];
}

function uniqueSuffix(): string {
  return Math.floor(nextRandom() * 1_000_000)
    .toString(36)
    .padStart(6, '0');
}

/** Matches the Portland clinic phone format used in seed data. */
export function portlandPhone(): string {
  const digits = Math.floor(nextRandom() * 10_000)
    .toString()
    .padStart(4, '0');
  return `(503) 555-${digits}`;
}

/** Safe test-only email domain (RFC 2606). */
export function testEmail(prefix = 'patient'): string {
  return `${prefix}.${uniqueSuffix()}@example.test`;
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

/** Substring used to locate a patient row in the dashboard table/search. */
export function patientRowMatch(patient: PatientFormData): string {
  return patient.lastName;
}

/** Converts an ISO date (yyyy-mm-dd) to the dd/mm/yyyy format used by staff search. */
export function toSearchDateOfBirth(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function randomBirthDate(): string {
  const year = 1940 + Math.floor(nextRandom() * 60);
  const month = 1 + Math.floor(nextRandom() * 12);
  const day = 1 + Math.floor(nextRandom() * 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** ISO birth date unlikely to exist in seed data or collide across parallel tests. */
export function uniqueBirthDate(): string {
  const n = Date.now() + Math.floor(nextRandom() * 1_000_000);
  const day = 1 + (n % 28);
  const month = 1 + (Math.floor(n / 28) % 12);
  const year = 2090 + (Math.floor(n / (28 * 12)) % 9);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function recentVisitDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(nextRandom() * 30));
  return date.toISOString().slice(0, 10);
}

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

export function buildVisitHistory(overrides: Partial<VisitHistoryFormData> = {}): VisitHistoryFormData {
  return {
    visitDate: recentVisitDate(),
    procedure: pick(DENTAL_PROCEDURES),
    description: 'Routine follow-up visit.',
    dentist: `Dr. ${faker.person.lastName()}`,
    ...overrides
  };
}

export function buildClinicUpdate(overrides: Partial<ClinicFormData> = {}): ClinicFormData {
  return {
    tagline: pick(CATCHPHRASES),
    address: portlandStreetAddress(),
    phone: portlandPhone(),
    email: testEmail('clinic'),
    hours: 'Mon–Fri 8:00–17:00',
    ...overrides
  };
}
