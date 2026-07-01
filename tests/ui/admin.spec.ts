import { adminTest, expect } from '../fixtures';
import { adminAuthState } from '../helpers/auth-state';
import { hasAdminCredentials } from '../helpers/supabase';
import { buildClinicUpdate, buildPatient, patientRowMatch, patientSearchQuery, testEmail } from '../helpers/test-data';
import { PublicPage } from '../pages';

const credentialsMessage =
  'Set ADMIN_PASSWORD in .env to match your Supabase admin user (see .env.example).';

adminTest.describe('Admin dashboard', () => {
  adminTest.use({ storageState: adminAuthState });

  adminTest.beforeEach(async ({ adminPage }) => {
    adminTest.skip(!hasAdminCredentials(), credentialsMessage);

    await adminPage.open();
    await adminPage.waitForReady();
  });

  adminTest('shows clinic form and patient table', async ({ adminPage }) => {
    await expect(adminPage.clinicForm).toBeVisible();
    await adminPage.showPatientsTab();
    await expect(adminPage.patientTable.table).toBeVisible();
    await expect(adminPage.patientPagination.bar).toBeVisible();
  });

  adminTest('updates clinic tagline', async ({ adminPage, page }) => {
    const publicPage = new PublicPage(page);
    const update = buildClinicUpdate();

    await adminPage.updateClinicInfo(update);
    await expect(adminPage.alert).toContainText(/saved/i);

    await publicPage.open();
    await expect(publicPage.clinicTagline).toHaveText(update.tagline!);
  });

  adminTest('adds a new patient', async ({ adminPage }) => {
    const patient = buildPatient();

    await adminPage.addPatient(patient);

    await expect(adminPage.alert).toContainText(/saved/i);
    await adminPage.patientSearch.searchByName(patientSearchQuery(patient));
    await expect(adminPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible({
      timeout: 10_000
    });
  });

  adminTest('switches between clinic and patients tabs', async ({ adminPage }) => {
    await expect(adminPage.clinicPanel).toBeVisible();
    await expect(adminPage.clinicForm).toBeVisible();

    await adminPage.showPatientsTab();
    await expect(adminPage.patientsPanel).toBeVisible();
    await expect(adminPage.patientTable.table).toBeVisible();

    await adminPage.showClinicTab();
    await expect(adminPage.clinicPanel).toBeVisible();
  });

  adminTest('edits an existing patient', async ({ adminPage }) => {
    const patient = buildPatient();
    const updatedEmail = testEmail('updated');

    await adminPage.addPatient(patient);
    await expect(adminPage.alert).toContainText(/saved/i);

    await adminPage.editPatient(patientRowMatch(patient), { email: updatedEmail });
    await expect(adminPage.alert).toContainText(/saved/i);

    await adminPage.patientSearch.searchByName(patientSearchQuery(patient));
    await expect(adminPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible({
      timeout: 10_000
    });
    await expect(adminPage.patientTable.rowByName(patientRowMatch(patient))).toContainText(updatedEmail);
  });

  adminTest('deletes a patient', async ({ adminPage, patientTracker }) => {
    const patient = buildPatient();

    await adminPage.addPatient(patient);
    await expect(adminPage.alert).toContainText(/saved/i);

    patientTracker.untrack(patient);
    await adminPage.deletePatient(patientRowMatch(patient));
    await expect(adminPage.alert).toContainText(/deleted/i);

    await adminPage.patientSearch.search({ name: patientSearchQuery(patient) });
    await expect(adminPage.patientTable.rowByName(patientRowMatch(patient))).toHaveCount(0);
  });

  adminTest('searches patients by name', async ({ adminPage }) => {
    const targetPatient = buildPatient();
    const otherPatient = buildPatient();

    await adminPage.addPatient(targetPatient);
    await adminPage.addPatient(otherPatient);

    await adminPage.patientSearch.searchByName(patientSearchQuery(targetPatient));
    await expect(adminPage.patientSearch.rowByName(patientRowMatch(targetPatient))).toBeVisible({
      timeout: 10_000
    });
    await expect(adminPage.patientTable.rowByName(patientRowMatch(otherPatient))).toHaveCount(0);
  });

  adminTest('paginates the patient list', async ({ adminPage }) => {
    await adminPage.showPatientsTab();
    adminTest.skip(
      !(await adminPage.patientPagination.hasMultiplePages()),
      'Requires at least 2 pages of patients'
    );

    await expect(adminPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);

    await adminPage.patientPagination.goToNextPage();
    await expect(adminPage.patientPagination.pageInfo).toContainText(/Page 2 of/i);

    await adminPage.patientPagination.goToPreviousPage();
    await expect(adminPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);
  });

  adminTest('updates clinic contact info on public site', async ({ adminPage, page }) => {
    const publicPage = new PublicPage(page);
    const update = buildClinicUpdate();

    await adminPage.updateClinicInfo(update);
    await expect(adminPage.alert).toContainText(/saved/i);

    await publicPage.open();
    await expect(publicPage.clinicAddress).toHaveText(update.address!);
    await expect(publicPage.clinicPhone).toHaveText(update.phone!);
    await expect(publicPage.clinicEmail).toHaveText(update.email!);
    await expect(publicPage.clinicHours).toHaveText(update.hours!);
  });

  adminTest('logs out to login page', async ({ adminPage, page }) => {
    await adminPage.logout();

    await expect(page).toHaveURL(/login\.html/);
  });
});
