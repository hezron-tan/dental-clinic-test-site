import { expect, test } from '@playwright/test';
import { adminAuthState } from '../helpers/auth-state';
import { hasAdminCredentials } from '../helpers/supabase';
import { buildClinicUpdate, buildPatient, patientRowMatch, testEmail } from '../helpers/test-data';
import { AdminDashboardPage, PublicPage } from '../pages';

const credentialsMessage =
  'Set ADMIN_PASSWORD in .env to match your Supabase admin user (see .env.example).';

test.describe('Admin dashboard', () => {
  test.use({ storageState: adminAuthState });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials(), credentialsMessage);

    const adminPage = new AdminDashboardPage(page);
    await adminPage.open();
    await adminPage.waitForReady();
  });

  // Verifies the admin dashboard shows the clinic form and patient management tab.
  test('shows clinic form and patient table', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await expect(adminPage.clinicForm).toBeVisible();
    await adminPage.showPatientsTab();
    await expect(adminPage.patientTable.table).toBeVisible();
    await expect(adminPage.patientPagination.bar).toBeVisible();
  });

  // Verifies updating the clinic tagline saves successfully and appears on the public homepage.
  test('updates clinic tagline', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const publicPage = new PublicPage(page);
    const update = buildClinicUpdate();

    await adminPage.updateClinicInfo(update);

    await publicPage.open();
    await expect(publicPage.clinicTagline).toHaveText(update.tagline!);
  });

  // Verifies an admin can add a new patient and find them via name search.
  test('adds a new patient', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const patient = buildPatient();

    await adminPage.addPatient(patient);

    await expect(adminPage.alert).toContainText(/saved/i);
    await adminPage.patientSearch.searchByName(patientRowMatch(patient));
  });

  // Verifies switching between clinic and patients tabs shows the correct panels.
  test('switches between clinic and patients tabs', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await expect(adminPage.clinicPanel).toBeVisible();
    await expect(adminPage.clinicForm).toBeVisible();

    await adminPage.showPatientsTab();
    await expect(adminPage.patientsPanel).toBeVisible();
    await expect(adminPage.patientTable.table).toBeVisible();

    await adminPage.showClinicTab();
    await expect(adminPage.clinicPanel).toBeVisible();
  });

  // Verifies an admin can edit a patient's email from the edit modal.
  test('edits an existing patient', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const patient = buildPatient();
    const updatedEmail = testEmail('updated');

    await adminPage.addPatient(patient);
    await expect(adminPage.alert).toContainText(/saved/i);

    await adminPage.editPatient(patientRowMatch(patient), { email: updatedEmail });
    await expect(adminPage.alert).toContainText(/saved/i);

    await adminPage.patientSearch.searchByName(patientRowMatch(patient));
    await expect(adminPage.patientTable.rowByName(patientRowMatch(patient))).toContainText(updatedEmail);
  });

  // Verifies an admin can delete a patient after confirming the dialog.
  test('deletes a patient', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const patient = buildPatient();

    await adminPage.addPatient(patient);
    await expect(adminPage.alert).toContainText(/saved/i);

    await adminPage.deletePatient(patientRowMatch(patient));
    await adminPage.patientSearch.search({ name: patientRowMatch(patient) });
    await expect(adminPage.patientTable.rowByName(patientRowMatch(patient))).toHaveCount(0);
  });

  // Verifies the patient search form filters results by name.
  test('searches patients by name', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const targetPatient = buildPatient();
    const otherPatient = buildPatient();

    await adminPage.addPatient(targetPatient);
    await adminPage.addPatient(otherPatient);

    await adminPage.patientSearch.searchByName(patientRowMatch(targetPatient));
    await expect(adminPage.patientTable.rowByName(patientRowMatch(targetPatient))).toBeVisible();
    await expect(adminPage.patientTable.rowByName(patientRowMatch(otherPatient))).toHaveCount(0);
  });

  // Verifies pagination controls advance through the patient list.
  test('paginates the patient list', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.showPatientsTab();
    await expect(adminPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);

    await adminPage.patientPagination.goToNextPage();
    await expect(adminPage.patientPagination.pageInfo).toContainText(/Page 2 of/i);

    await adminPage.patientPagination.goToPreviousPage();
    await expect(adminPage.patientPagination.pageInfo).toContainText(/Page 1 of/i);
  });

  // Verifies updated clinic contact fields appear on the public homepage.
  test('updates clinic contact info on public site', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const publicPage = new PublicPage(page);
    const update = buildClinicUpdate();

    await adminPage.updateClinicInfo(update);

    await publicPage.open();
    await expect(publicPage.clinicAddress).toHaveText(update.address!);
    await expect(publicPage.clinicPhone).toHaveText(update.phone!);
    await expect(publicPage.clinicEmail).toHaveText(update.email!);
    await expect(publicPage.clinicHours).toHaveText(update.hours!);
  });

  // Verifies logging out from the admin dashboard returns to the login page.
  test('logs out to login page', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.logout();

    await expect(page).toHaveURL(/login\.html/);
  });
});
