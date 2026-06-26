import { expect, test } from '@playwright/test';
import { adminEmail, adminPassword } from '../helpers/supabase';

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!adminPassword, 'Set ADMIN_PASSWORD in .env');
    await page.goto('/login.html');
    await page.getByTestId('login-email').fill(adminEmail);
    await page.getByTestId('login-password').fill(adminPassword);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/admin\/?/);
  });

  test('shows clinic form and patient table', async ({ page }) => {
    await expect(page.getByTestId('clinic-form')).toBeVisible();
    await page.getByTestId('tab-patients').click();
    await expect(page.getByTestId('patient-table')).toBeVisible();
    await expect(page.getByTestId('patient-pagination')).toBeVisible();
  });

  test('updates clinic tagline', async ({ page }) => {
    const tagline = `Automation test tagline ${Date.now()}`;
    await page.getByTestId('clinic-tagline-input').fill(tagline);
    await page.getByTestId('save-clinic').click();

    await expect(page.getByTestId('admin-alert')).toContainText(/saved/i);

    await page.goto('/');
    await expect(page.getByTestId('clinic-tagline')).toHaveText(tagline);
  });

  test('adds a new patient', async ({ page }) => {
    const suffix = String(Date.now()).slice(-6);
    await page.getByTestId('tab-patients').click();
    await page.getByTestId('add-patient').click();
    await expect(page.getByTestId('patient-form-overlay')).toBeVisible();
    await page.getByTestId('patient-first-name').fill('Test');
    await page.getByTestId('patient-last-name').fill(`Patient${suffix}`);
    await page.getByTestId('patient-email').fill(`test.${suffix}@example.test`);
    await page.getByTestId('patient-phone').fill(`(503) 555-${suffix.slice(0, 4)}`);
    await page.getByTestId('save-patient').click();

    await expect(page.getByTestId('admin-alert')).toContainText(/saved/i);
    await expect(page.getByTestId('patient-row').filter({ hasText: `Patient${suffix}` })).toBeVisible();
  });
});
