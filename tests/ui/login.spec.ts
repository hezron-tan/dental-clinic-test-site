import { expect, test } from '@playwright/test';
import {
  AdminDashboardPage,
  LoginPage,
  StaffDashboardPage
} from '../pages';
import { hasAdminCredentials, hasStaffCredentials } from '../helpers/supabase';

const credentialsMessage =
  'Set ADMIN_PASSWORD and STAFF_PASSWORD in .env to match your Supabase test users (see .env.example).';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
  });

  // Verifies invalid credentials show an error and keep the user on the login page.
  test('rejects invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login({ email: 'wrong@clinic.test', password: 'wrong-password' });

    await expect(loginPage.alert).toBeVisible();
    await expect(page).toHaveURL(/login\.html/);
  });

  // Verifies an admin user is redirected to the admin dashboard after sign-in.
  test('admin redirects to admin dashboard', async ({ page }) => {
    test.skip(!hasAdminCredentials(), credentialsMessage);

    const loginPage = new LoginPage(page);
    const adminPage = new AdminDashboardPage(page);

    await loginPage.loginExpectingDashboard('admin');

    await expect(adminPage.userGreeting).toContainText(/hello/i);
    await expect(adminPage.clinicForm).toBeVisible();
  });

  // Verifies a staff user is redirected to the staff dashboard after sign-in.
  test('staff redirects to staff dashboard', async ({ page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const loginPage = new LoginPage(page);
    const staffPage = new StaffDashboardPage(page);

    await loginPage.loginExpectingDashboard('staff');

    await expect(staffPage.patientTable.table).toBeVisible();
  });

  // Verifies logging out from the staff dashboard returns the user to the login page.
  test('logout returns to login', async ({ page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const loginPage = new LoginPage(page);
    const staffPage = new StaffDashboardPage(page);

    await loginPage.loginExpectingDashboard('staff');
    await staffPage.waitForReady();

    await staffPage.logout();

    await expect(page).toHaveURL(/login\.html/);
  });
});
