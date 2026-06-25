import { expect, test } from '@playwright/test';

test.describe('Public clinic site', () => {
  test('displays clinic name and contact info', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('clinic-name')).toBeVisible();
    await expect(page.getByTestId('clinic-address')).toBeVisible();
    await expect(page.getByTestId('clinic-phone')).toBeVisible();
    await expect(page.getByTestId('clinic-email')).toBeVisible();
    await expect(page.getByTestId('clinic-hours')).toBeVisible();
  });

  test('navigates to staff login', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-login').click();
    await expect(page).toHaveURL(/login\.html/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
