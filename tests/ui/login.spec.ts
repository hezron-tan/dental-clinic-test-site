import { expect, unauthenticatedTest as test } from '../fixtures';
import { hasAdminCredentials, hasStaffCredentials } from '../helpers/supabase';
import { AdminDashboardPage, StaffDashboardPage } from '../pages';

const credentialsMessage =
  'Set ADMIN_PASSWORD and STAFF_PASSWORD in .env to match your Supabase test users (see .env.example).';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('Verify that as an admin, I am redirected to the admin dashboard after login', async ({ loginPage, page }) => {
    test.skip(!hasAdminCredentials(), credentialsMessage);

    const adminPage = new AdminDashboardPage(page);

    await loginPage.loginExpectingDashboard('admin');

    await expect(adminPage.userGreeting).toContainText(/hello/i);
    await expect(adminPage.clinicForm).toBeVisible();
  });

  test('Verify that as a staff user, I am redirected to the staff dashboard after login', async ({ loginPage, page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const staffPage = new StaffDashboardPage(page);

    await loginPage.loginExpectingDashboard('staff');

    await expect(staffPage.patientTable.table).toBeVisible();
  });

  test('Verify that after logout, I am returned to the login page', async ({ loginPage, page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const staffPage = new StaffDashboardPage(page);

    await loginPage.loginExpectingDashboard('staff');
    await staffPage.waitForReady();

    await staffPage.logout();

    await expect(page).toHaveURL(/login\.html/);
  });
});
