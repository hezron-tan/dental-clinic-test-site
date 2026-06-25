import { expect, test } from '@playwright/test';
import { staffEmail, staffPassword } from '../helpers/supabase';

test.describe('Staff dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!staffPassword, 'Set STAFF_PASSWORD in .env');
    await page.goto('/login.html');
    await page.getByTestId('login-email').fill(staffEmail);
    await page.getByTestId('login-password').fill(staffPassword);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/staff\/?/);
  });

  test('lists patients and shows details', async ({ page }) => {
    await expect(page.getByTestId('patient-list')).toBeVisible();
    await page.getByTestId('select-patient').filter({ hasText: 'Johnson' }).first().click();

    await expect(page.getByTestId('patient-details')).toBeVisible();
    await expect(page.getByTestId('history-list')).toBeVisible();
    await expect(page.getByTestId('history-form')).toBeVisible();
  });

  test('updates patient phone number', async ({ page }) => {
    await page.getByTestId('select-patient').filter({ hasText: 'Mendez' }).first().click();
    await expect(page.getByTestId('patient-details')).toBeVisible();

    const uniquePhone = `(503) 555-${String(Date.now()).slice(-4)}`;
    await page.getByTestId('patient-phone').fill(uniquePhone);
    await page.getByTestId('save-patient').click();

    await expect(page.getByTestId('staff-alert')).toContainText(/updated/i);
    await expect(page.getByTestId('detail-phone')).toHaveText(uniquePhone);
  });

  test('adds a visit history record', async ({ page }) => {
    await page.getByTestId('select-patient').filter({ hasText: 'Chen' }).first().click();

    const today = new Date().toISOString().slice(0, 10);
    await page.getByTestId('history-date').fill(today);
    await page.getByTestId('history-procedure').selectOption('Cleaning');
    await page.getByTestId('history-description').fill('Playwright automated test visit');
    await page.getByTestId('history-dentist').fill('Dr. Test');
    await page.getByTestId('add-history').click();

    await expect(page.getByTestId('staff-alert')).toContainText(/added/i);
    await expect(page.getByTestId('history-entry').first()).toContainText('Cleaning');
  });
});
