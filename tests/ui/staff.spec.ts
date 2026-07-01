import { expect, staffTest } from '../fixtures';
import { hasStaffCredentials } from '../helpers/supabase';
import { staffAuthState } from '../helpers/auth-state';
import {
  buildPatient,
  buildVisitHistory,
  patientRowMatch,
  patientSearchQuery,
  portlandPhone,
  toSearchDateOfBirth,
  uniqueBirthDate
} from '../helpers/test-data';
import type { PatientFormData } from '../models';
import { StaffDashboardPage } from '../pages';

const credentialsMessage =
  'Set STAFF_PASSWORD in .env to match your Supabase staff user (see .env.example).';

async function expectSuccessToast(staffPage: StaffDashboardPage, message: RegExp): Promise<void> {
  await expect(staffPage.successToast).toBeVisible();
  await expect(staffPage.successToast).toHaveClass(/toast-success/);
  await expect(staffPage.successToast).toContainText(message);
}

async function addTestPatient(
  staffPage: StaffDashboardPage,
  overrides: Partial<PatientFormData> = {},
  options: { leaveViewOpen?: boolean } = {}
): Promise<PatientFormData> {
  const patient = buildPatient(overrides);
  await staffPage.addPatient(patient);
  await expectSuccessToast(staffPage, /added/i);
  if (!options.leaveViewOpen) {
    await staffPage.closeViewPatientViaCloseButton();
    await expect(staffPage.viewPatientOverlay).toBeHidden();
  }
  return patient;
}

staffTest.describe('Staff dashboard', () => {
  staffTest.use({ storageState: staffAuthState });

  staffTest.beforeEach(async ({ staffPage }) => {
    staffTest.skip(!hasStaffCredentials(), credentialsMessage);

    await staffPage.open();
    await staffPage.waitForReady();
  });

  staffTest('lists patients in a table and shows details', async ({ staffPage }) => {
    const patient = await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await expect(staffPage.patientTable.table).toBeVisible();
    await expect(staffPage.patientPagination.bar).toBeVisible();
    await expect(staffPage.viewPatientOverlay).toBeVisible();
    await expect(staffPage.patientReadonlyView).toBeVisible();
    await expect(staffPage.patientEditView).toBeHidden();
    await expect(staffPage.patientReadonlyView).toContainText(patient.firstName);
    await expect(staffPage.patientReadonlyView).toContainText(patient.lastName);
    await expect(staffPage.historyForm.historyList).toBeVisible();
    await expect(staffPage.deletePatientButtons).toHaveCount(0);
  });

  staffTest('shows View and Add Visit actions for each patient row', async ({ staffPage }) => {
    await expect(staffPage.firstRowViewButton).toBeVisible();
    await expect(staffPage.firstRowAddVisitButton).toBeVisible();
  });

  staffTest('opens view overlay in read-only mode from View action', async ({ staffPage }) => {
    const patient = await addTestPatient(staffPage);

    await staffPage.openViewPatient(patientRowMatch(patient));

    await expect(staffPage.patientReadonlyView).toBeVisible();
    await expect(staffPage.patientEditView).toBeHidden();
    await expect(staffPage.editPatientButton).toBeVisible();
    await expect(staffPage.viewPhone).toHaveText(patient.phone!);
    await expect(staffPage.historyForm.historyList).toBeVisible();
  });

  staffTest('switches to edit mode from the view overlay', async ({ staffPage }) => {
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.enterEditMode();

    await expect(staffPage.patientEditView).toBeVisible();
    await expect(staffPage.patientReadonlyView).toBeHidden();
    await expect(staffPage.editPatientButton).toHaveAttribute('hidden', '');
    await expect(staffPage.patientForm.saveButton).toBeVisible();
  });

  staffTest('closes view overlay with Cancel button', async ({ staffPage }) => {
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.closeViewPatientViaCancel();
    await expect(staffPage.viewPatientOverlay).toBeHidden();
  });

  staffTest('closes view overlay with close button', async ({ staffPage }) => {
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.closeViewPatientViaCloseButton();
    await expect(staffPage.viewPatientOverlay).toBeHidden();
  });

  staffTest('updates patient phone number', async ({ staffPage }) => {
    const patient = await addTestPatient(staffPage, {}, { leaveViewOpen: true });
    const uniquePhone = portlandPhone();

    await staffPage.enterEditMode();
    await staffPage.patientForm.phoneInput.fill(uniquePhone);
    await staffPage.patientForm.submit();

    await expectSuccessToast(staffPage, /updated/i);
    await expect(staffPage.viewPatientOverlay).toBeHidden();

    await staffPage.openViewPatient(patientRowMatch(patient));
    await expect(staffPage.viewPhone).toHaveText(uniquePhone);
  });

  staffTest('allows dismissing success toast notifications', async ({ staffPage }) => {
    await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.dismissToast();
    await expect(staffPage.toast).toHaveCount(0);
  });

  staffTest('opens add visit overlay from Add Visit action', async ({ staffPage }) => {
    const patient = buildPatient();
    await staffPage.addPatient(patient);
    await expectSuccessToast(staffPage, /added/i);
    await staffPage.closeViewPatientViaCloseButton();
    await expect(staffPage.viewPatientOverlay).toBeHidden();

    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await expect(staffPage.addVisitOverlay).toBeVisible();
    await expect(staffPage.historyForm.form).toBeVisible();
    await expect(staffPage.addVisitOverlay).toContainText(patient.firstName);
  });

  staffTest('closes add visit overlay with Cancel button', async ({ staffPage }) => {
    const patient = buildPatient();
    await staffPage.addPatient(patient);
    await expectSuccessToast(staffPage, /added/i);
    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await staffPage.closeAddVisitViaCancel();
    await expect(staffPage.addVisitOverlay).toBeHidden();
  });

  staffTest('closes add visit overlay with close button', async ({ staffPage }) => {
    const patient = buildPatient();
    await staffPage.addPatient(patient);
    await expectSuccessToast(staffPage, /added/i);
    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await staffPage.closeAddVisitViaCloseButton();
    await expect(staffPage.addVisitOverlay).toBeHidden();
  });

  staffTest('adds a visit history record', async ({ staffPage }) => {
    const visit = buildVisitHistory();
    const patient = await addTestPatient(staffPage, {}, { leaveViewOpen: true });

    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.addVisitHistory(visit, patientRowMatch(patient));

    await expectSuccessToast(staffPage, /updated/i);
    await expect(staffPage.addVisitOverlay).toBeHidden();

    await staffPage.openViewPatient(patientRowMatch(patient));
    await expect(staffPage.historyForm.historyEntries.first()).toContainText(visit.procedure);
  });

  staffTest('searches patients by name', async ({ staffPage }) => {
    const targetPatient = await addTestPatient(staffPage);
    const otherPatient = await addTestPatient(staffPage);

    await staffPage.patientSearch.searchByName(patientSearchQuery(targetPatient));
    await expect(staffPage.patientSearch.rowByName(patientRowMatch(targetPatient))).toBeVisible({
      timeout: 10_000
    });
    await expect(staffPage.patientTable.rowByName(patientRowMatch(otherPatient))).toHaveCount(0);
  });

  staffTest('searches patients by date of birth', async ({ staffPage }) => {
    const patient = await addTestPatient(staffPage, {
      dateOfBirth: uniqueBirthDate()
    });

    await staffPage.patientSearch.searchByName(patientSearchQuery(patient));
    await expect(staffPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible({
      timeout: 10_000
    });
    await staffPage.patientSearch.clear();
    await staffPage.patientSearch.searchByDateOfBirth(toSearchDateOfBirth(patient.dateOfBirth!));
    await expect(staffPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible({
      timeout: 10_000
    });
  });

  staffTest('clears search filters', async ({ staffPage }) => {
    const patient = await addTestPatient(staffPage);

    await staffPage.patientSearch.searchByName(patientSearchQuery(patient));
    await expect(staffPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible({
      timeout: 10_000
    });

    await staffPage.patientSearch.clear();
    await expect(staffPage.patientTable.rows.first()).toBeVisible();
    expect(await staffPage.patientTable.rows.count()).toBeGreaterThan(1);
  });

  staffTest('rejects invalid date of birth in search', async ({ staffPage }) => {
    await staffPage.patientSearch.search({ dateOfBirth: '99/99/9999' });

    await expect(staffPage.alert).toBeVisible();
    await expect(staffPage.alert).toContainText(/dd\/mm\/yyyy/i);
  });

  staffTest('paginates the patient list', async ({ staffPage }) => {
    staffTest.skip(
      !(await staffPage.patientPagination.hasMultiplePages()),
      'Requires at least 2 pages of patients'
    );

    await expect(staffPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);

    await staffPage.patientPagination.goToNextPage();
    await expect(staffPage.patientPagination.pageInfo).toContainText(/Page 2 of/i);

    await staffPage.patientPagination.goToPreviousPage();
    await expect(staffPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);
  });

  staffTest('closes add patient modal without saving', async ({ staffPage }) => {
    const patient = buildPatient();

    await staffPage.openAddPatientModal();
    await staffPage.fillAddPatientForm(patient);
    await staffPage.closeAddPatientModal();

    await expect(staffPage.addPatientOverlay).toBeHidden();
    await staffPage.patientSearch.search({ name: patientSearchQuery(patient) });
    await expect(staffPage.patientTable.rowByName(patientRowMatch(patient))).toHaveCount(0);
  });
});
