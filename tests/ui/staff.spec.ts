import { expect, test } from '@playwright/test';
import { hasStaffCredentials } from '../helpers/supabase';
import { buildPatient, buildVisitHistory, patientRowMatch, portlandPhone, toSearchDateOfBirth } from '../helpers/test-data';
import { LoginPage, StaffDashboardPage } from '../pages';
import type { PatientFormData } from '../models';

const credentialsMessage =
  'Set STAFF_PASSWORD in .env to match your Supabase staff user (see .env.example).';

async function addTestPatient(
  staffPage: StaffDashboardPage,
  overrides: Partial<PatientFormData> = {}
): Promise<PatientFormData> {
  const patient = buildPatient(overrides);
  await staffPage.addPatient(patient);
  await expect(staffPage.alert).toContainText(/added/i);
  return patient;
}

test.describe('Staff dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const loginPage = new LoginPage(page);
    const staffPage = new StaffDashboardPage(page);
    await staffPage.openViaLogin(loginPage);
  });

  // Verifies the patient list loads and staff can view details without delete access.
  test('lists patients in a table and shows details', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = await addTestPatient(staffPage);

    await expect(staffPage.patientTable.table).toBeVisible();
    await expect(staffPage.patientPagination.bar).toBeVisible();
    await expect(staffPage.patientDetails).toContainText(patient.firstName);
    await expect(staffPage.patientDetails).toContainText(patient.lastName);

    await expect(staffPage.patientDetails).toBeVisible();
    await expect(staffPage.historyForm.historyList).toBeVisible();
    await expect(staffPage.historyForm.form).toBeVisible();
    await expect(page.getByTestId('delete-patient')).toHaveCount(0);
  });

  // Verifies staff can update a patient's phone number from the details panel.
  test('updates patient phone number', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    await addTestPatient(staffPage);
    const uniquePhone = portlandPhone();

    await expect(staffPage.patientDetails).toBeVisible();

    await staffPage.patientForm.phoneInput.fill(uniquePhone);
    await staffPage.patientForm.submit();

    await expect(staffPage.alert).toContainText(/updated/i);
    await expect(staffPage.detailPhone).toHaveText(uniquePhone);
  });

  // Verifies staff can add a visit history record for an existing patient.
  test('adds a visit history record', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const visit = buildVisitHistory();

    await addTestPatient(staffPage);
    await staffPage.addVisitHistory(visit);

    await expect(staffPage.alert).toContainText(/added/i);
    await expect(staffPage.historyForm.historyEntries.first()).toContainText(visit.procedure);
  });

  // Verifies the patient search form filters results by name.
  test('searches patients by name', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const targetPatient = await addTestPatient(staffPage);
    const otherPatient = await addTestPatient(staffPage);

    await staffPage.patientSearch.searchByName(patientRowMatch(targetPatient));

    await expect(staffPage.patientTable.rowByName(patientRowMatch(targetPatient))).toBeVisible();
    await expect(staffPage.patientTable.rowByName(patientRowMatch(otherPatient))).toHaveCount(0);
  });

  // Verifies the patient search form filters results by date of birth.
  test('searches patients by date of birth', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = await addTestPatient(staffPage, {
      dateOfBirth: '1985-06-15'
    });

    await staffPage.patientSearch.clear();
    await staffPage.patientSearch.searchByDateOfBirth(
      toSearchDateOfBirth(patient.dateOfBirth!),
      patientRowMatch(patient)
    );
    await expect(staffPage.patientTable.rowByName(patientRowMatch(patient))).toBeVisible();
  });

  // Verifies clearing search filters restores the full patient list.
  test('clears search filters', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = await addTestPatient(staffPage);

    await staffPage.patientSearch.searchByName(patientRowMatch(patient));
    await expect(staffPage.patientTable.rowByName(patientRowMatch(patient))).toHaveCount(1);

    await staffPage.patientSearch.clear();
    await expect(staffPage.patientTable.rows.first()).toBeVisible();
    expect(await staffPage.patientTable.rows.count()).toBeGreaterThan(1);
  });

  // Verifies an invalid date of birth format shows a validation error.
  test('rejects invalid date of birth in search', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.patientSearch.search({ dateOfBirth: '99/99/9999' });

    await expect(staffPage.alert).toBeVisible();
    await expect(staffPage.alert).toContainText(/dd\/mm\/yyyy/i);
  });

  // Verifies pagination controls advance through the patient list.
  test('paginates the patient list', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await expect(staffPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);

    await staffPage.patientPagination.goToNextPage();
    await expect(staffPage.patientPagination.pageInfo).toContainText(/Page 2 of/i);

    await staffPage.patientPagination.goToPreviousPage();
    await expect(staffPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);
  });

  // Verifies closing the add-patient modal discards unsaved data.
  test('closes add patient modal without saving', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();

    await staffPage.openAddPatientModal();
    await staffPage.fillAddPatientForm(patient);
    await staffPage.closeAddPatientModal();

    await expect(staffPage.addPatientOverlay).toBeHidden();
    await staffPage.patientSearch.search({ name: patientRowMatch(patient) });
    await expect(staffPage.patientTable.rowByName(patientRowMatch(patient))).toHaveCount(0);
  });
});
