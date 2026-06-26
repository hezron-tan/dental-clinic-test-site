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

  test('lists patients in a table and shows details', async ({ page }) => {
    await expect(page.getByTestId('patient-table')).toBeVisible();
    await expect(page.getByTestId('patient-pagination')).toBeVisible();

    const johnsonRow = page.getByTestId('patient-row').filter({ hasText: 'Johnson' }).first();
    await johnsonRow.getByTestId('edit-patient').click();

    await expect(page.getByTestId('patient-details')).toBeVisible();
    await expect(page.getByTestId('history-list')).toBeVisible();
    await expect(page.getByTestId('history-form')).toBeVisible();
    await expect(page.getByTestId('delete-patient')).toHaveCount(0);
  });

  test('updates patient phone number', async ({ page }) => {
    const mendezRow = page.getByTestId('patient-row').filter({ hasText: 'Mendez' }).first();
    await mendezRow.getByTestId('edit-patient').click();
    await expect(page.getByTestId('patient-details')).toBeVisible();

    const uniquePhone = `(503) 555-${String(Date.now()).slice(-4)}`;
    await page.getByTestId('patient-phone').fill(uniquePhone);
    await page.getByTestId('save-patient').click();

    await expect(page.getByTestId('staff-alert')).toContainText(/updated/i);
    await expect(page.getByTestId('detail-phone')).toHaveText(uniquePhone);
  });

  test('adds a visit history record', async ({ page }) => {
    const chenRow = page.getByTestId('patient-row').filter({ hasText: 'Chen' }).first();
    await chenRow.getByTestId('edit-patient').click();

    const today = new Date().toISOString().slice(0, 10);
    await page.getByTestId('history-date').fill(today);
    await page.getByTestId('history-procedure').selectOption('Cleaning');
    await page.getByTestId('history-description').fill('Playwright automated test visit');
    await page.getByTestId('history-dentist').fill('Dr. Test');
    await page.getByTestId('add-history').click();

    await expect(page.getByTestId('staff-alert')).toContainText(/added/i);
    await expect(page.getByTestId('history-entry').first()).toContainText('Cleaning');
  });

  test('searches patients by name', async ({ page }) => {
    await page.getByTestId('search-name').fill('Johnson');
    await page.getByTestId('search-patients').click();

    const rows = page.getByTestId('patient-row');
    await expect(rows).not.toHaveCount(0);
    await expect(rows.first()).toContainText('Johnson');
  });
});
