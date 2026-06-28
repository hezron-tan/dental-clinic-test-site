import { expect, test } from '@playwright/test';
import { staffAuthState } from '../helpers/auth-state';
import { hasStaffCredentials } from '../helpers/supabase';
import {
  buildPatient,
  buildVisitHistory,
  patientRowMatch,
  portlandPhone,
  toSearchDateOfBirth,
  uniqueBirthDate
} from '../helpers/test-data';
import { StaffDashboardPage } from '../pages';
import type { PatientFormData } from '../models';

const credentialsMessage =
  'Set STAFF_PASSWORD in .env to match your Supabase staff user (see .env.example).';

async function addTestPatient(
  staffPage: StaffDashboardPage,
  overrides: Partial<PatientFormData> = {},
  options: { leaveViewOpen?: boolean } = {}
): Promise<PatientFormData> {
  const patient = buildPatient(overrides);
  await staffPage.addPatient(patient);
  await staffPage.expectSuccessToast(/added/i);
  if (!options.leaveViewOpen) {
    await staffPage.closeViewPatientViaCloseButton();
  }
  return patient;
}

test.describe('Staff dashboard', () => {
  test.use({ storageState: staffAuthState });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const staffPage = new StaffDashboardPage(page);
    await staffPage.open();
    await staffPage.waitForReady();
  });

  // Verifies the patient list loads and staff can view details without delete access.
  test('lists patients in a table and shows details', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await expect(staffPage.patientTable.table).toBeVisible();
    await expect(staffPage.patientPagination.bar).toBeVisible();
    await expect(staffPage.viewPatientOverlay).toBeVisible();
    await expect(staffPage.patientReadonlyView).toBeVisible();
    await expect(staffPage.patientEditView).toBeHidden();
    await expect(staffPage.patientReadonlyView).toContainText(patient.firstName);
    await expect(staffPage.patientReadonlyView).toContainText(patient.lastName);
    await expect(staffPage.historyForm.historyList).toBeVisible();
    await expect(page.getByTestId('delete-patient')).toHaveCount(0);
  });

  // Verifies each patient row exposes View and Add Visit actions.
  test('shows View and Add Visit actions for each patient row', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await expect(staffPage.patientTable.rows.first().getByTestId('view-patient')).toBeVisible();
    await expect(staffPage.patientTable.rows.first().getByTestId('add-visit-patient')).toBeVisible();
  });

  // Verifies the View action opens a read-only patient overlay with visit history.
  test('opens view overlay in read-only mode from View action', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = await addTestPatient(staffPage);

    await staffPage.openViewPatient(patientRowMatch(patient));

    await expect(staffPage.patientReadonlyView).toBeVisible();
    await expect(staffPage.patientEditView).toBeHidden();
    await expect(staffPage.editPatientButton).toBeVisible();
    await expect(staffPage.viewPhone).toHaveText(patient.phone!);
    await expect(staffPage.historyForm.historyList).toBeVisible();
  });

  // Verifies the Edit button switches the view overlay into editable mode.
  test('switches to edit mode from the view overlay', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.enterEditMode();

    await expect(staffPage.patientEditView).toBeVisible();
    await expect(staffPage.patientReadonlyView).toBeHidden();
    await expect(staffPage.editPatientButton).toHaveAttribute('hidden', '');
    await expect(staffPage.patientForm.saveButton).toBeVisible();
  });

  // Verifies staff can close the view overlay with Cancel.
  test('closes view overlay with Cancel button', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.closeViewPatientViaCancel();
    await expect(staffPage.viewPatientOverlay).toBeHidden();
  });

  // Verifies staff can close the view overlay with the X button.
  test('closes view overlay with close button', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.closeViewPatientViaCloseButton();
    await expect(staffPage.viewPatientOverlay).toBeHidden();
  });

  // Verifies staff can update a patient's phone number from the view overlay.
  test('updates patient phone number', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = await addTestPatient(staffPage, {}, { leaveViewOpen: true });
    const uniquePhone = portlandPhone();

    await staffPage.enterEditMode();
    await staffPage.patientForm.phoneInput.fill(uniquePhone);
    await staffPage.patientForm.submit();

    await staffPage.expectSuccessToast(/updated/i);
    await expect(staffPage.viewPatientOverlay).toBeHidden();

    await staffPage.openViewPatient(patientRowMatch(patient));
    await expect(staffPage.viewPhone).toHaveText(uniquePhone);
  });

  // Verifies a success toast can be dismissed manually.
  test('allows dismissing success toast notifications', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.dismissToast();
    await expect(staffPage.toast).toHaveCount(0);
  });

  // Verifies the Add Visit action opens its overlay.
  test('opens add visit overlay from Add Visit action', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();
    await staffPage.addPatient(patient);
    await staffPage.expectSuccessToast(/added/i);
    await staffPage.closeViewPatientViaCloseButton();

    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await expect(staffPage.addVisitOverlay).toBeVisible();
    await expect(staffPage.historyForm.form).toBeVisible();
    await expect(staffPage.addVisitOverlay).toContainText(patient.firstName);
  });

  // Verifies staff can close the add visit overlay with Cancel.
  test('closes add visit overlay with Cancel button', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();
    await staffPage.addPatient(patient);
    await staffPage.expectSuccessToast(/added/i);
    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await staffPage.closeAddVisitViaCancel();
    await expect(staffPage.addVisitOverlay).toBeHidden();
  });

  // Verifies staff can close the add visit overlay with the X button.
  test('closes add visit overlay with close button', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();
    await staffPage.addPatient(patient);
    await staffPage.expectSuccessToast(/added/i);
    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await staffPage.closeAddVisitViaCloseButton();
    await expect(staffPage.addVisitOverlay).toBeHidden();
  });

  // Verifies staff can add a visit history record for an existing patient.
  test('adds a visit history record', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const visit = buildVisitHistory();
    const patient = await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.addVisitHistory(visit, patientRowMatch(patient));

    await staffPage.expectSuccessToast(/updated/i);
    await expect(staffPage.addVisitOverlay).toBeHidden();

    await staffPage.openViewPatient(patientRowMatch(patient));
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
      dateOfBirth: uniqueBirthDate()
    });

    await staffPage.patientSearch.searchByName(patientRowMatch(patient));
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
