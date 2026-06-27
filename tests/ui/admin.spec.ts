import { expect, test } from '@playwright/test';
import type { PatientFormData } from '../models';
import { hasAdminCredentials } from '../helpers/supabase';
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
    const tagline = `Automation test tagline ${Date.now()}`;

    await adminPage.updateClinicInfo({ tagline });

    await publicPage.open();
    await expect(publicPage.clinicTagline).toHaveText(tagline);
  });

  // Verifies an admin can add a new patient through the patients tab modal.
  test('adds a new patient', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);
    const suffix = String(Date.now()).slice(-6);
    const patient: PatientFormData = {
      firstName: 'Test',
      lastName: `Patient${suffix}`,
      email: `test.${suffix}@example.test`,
      phone: `(503) 555-${suffix.slice(0, 4)}`
    };

    await adminPage.showPatientsTab();
    await adminPage.addPatientButton.click();
    await expect(adminPage.patientFormOverlay).toBeVisible();
    await adminPage.patientForm.fillAndSubmit(patient);

    await expect(adminPage.alert).toContainText(/saved/i);
    await expect(adminPage.patientTable.rowByName(`Patient${suffix}`)).toBeVisible();
  });
});
