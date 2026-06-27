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

/** Set a fixed seed when you need reproducible values (e.g. debugging a flaky test). */
export function seedFaker(seed: number): void {
  faker.seed(seed);
}

function uniqueSuffix(): string {
  return faker.string.alphanumeric(6).toLowerCase();
}

/** Matches the Portland clinic phone format used in seed data. */
export function portlandPhone(): string {
  return `(503) 555-${faker.string.numeric(4)}`;
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

export function buildPatient(overrides: Partial<PatientFormData> = {}): PatientFormData {
  const suffix = uniqueSuffix();

  return {
    firstName: faker.person.firstName(),
    lastName: `${faker.person.lastName()}${suffix}`,
    dateOfBirth: faker.date.birthdate({ min: 18, max: 90, mode: 'age' }).toISOString().slice(0, 10),
    email: testEmail('patient'),
    phone: portlandPhone(),
    address: `${faker.location.streetAddress()}, Portland, OR`,
    ...overrides
  };
}

export function buildVisitHistory(overrides: Partial<VisitHistoryFormData> = {}): VisitHistoryFormData {
  return {
    visitDate: faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
    procedure: faker.helpers.arrayElement(DENTAL_PROCEDURES),
    description: faker.lorem.sentence(),
    dentist: `Dr. ${faker.person.lastName()}`,
    ...overrides
  };
}

export function buildClinicUpdate(overrides: Partial<ClinicFormData> = {}): ClinicFormData {
  return {
    tagline: faker.company.catchPhrase(),
    address: `${faker.location.streetAddress()}, Portland, OR`,
    phone: portlandPhone(),
    email: testEmail('clinic'),
    hours: 'Mon–Fri 8:00–17:00',
    ...overrides
  };
}
