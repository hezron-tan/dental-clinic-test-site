import { expect, test } from '@playwright/test';
import { adminEmail, adminPassword, staffEmail, staffPassword } from '../helpers/supabase';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!adminPassword || !staffPassword, 'Set ADMIN_PASSWORD and STAFF_PASSWORD in .env');
    await page.goto('/login.html');
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.getByTestId('login-email').fill('wrong@clinic.test');
    await page.getByTestId('login-password').fill('wrong-password');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-alert')).toBeVisible();
    await expect(page).toHaveURL(/login\.html/);
  });

  test('admin redirects to admin dashboard', async ({ page }) => {
    await page.getByTestId('login-email').fill(adminEmail);
    await page.getByTestId('login-password').fill(adminPassword);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/admin\/?/);
    await expect(page.getByTestId('user-greeting')).toContainText(/hello/i);
    await expect(page.getByTestId('clinic-form')).toBeVisible();
  });

  test('staff redirects to staff dashboard', async ({ page }) => {
    await page.getByTestId('login-email').fill(staffEmail);
    await page.getByTestId('login-password').fill(staffPassword);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/staff\/?/);
    await expect(page.getByTestId('patient-list')).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await page.getByTestId('login-email').fill(staffEmail);
    await page.getByTestId('login-password').fill(staffPassword);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/staff\/?/);

    await page.getByTestId('logout-btn').click();
    await expect(page).toHaveURL(/login\.html/);
  });
});
