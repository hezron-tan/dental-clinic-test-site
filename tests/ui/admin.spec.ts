import { expect, test } from '@playwright/test';
import { hasAdminCredentials } from '../helpers/supabase';
import { buildClinicUpdate, buildPatient, patientRowMatch } from '../helpers/test-data';
import { AdminDashboardPage, LoginPage, PublicPage } from '../pages';

const credentialsMessage =
  'Set ADMIN_PASSWORD in .env to match your Supabase admin user (see .env.example).';

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials(), credentialsMessage);

    const loginPage = new LoginPage(page);
    const adminPage = new AdminDashboardPage(page);
    await adminPage.openViaLogin(loginPage);
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
});
