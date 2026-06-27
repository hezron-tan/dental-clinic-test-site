import { expect, test } from '@playwright/test';
import { LoginPage, PublicPage } from '../pages';

test.describe('Public clinic site', () => {
  // Verifies the homepage renders clinic name, contact details, and office hours.
  test('displays clinic name and contact info', async ({ page }) => {
    const publicPage = new PublicPage(page);

    await publicPage.open();

    await expect(publicPage.clinicName).toBeVisible();
    await expect(publicPage.clinicTagline).toBeVisible();
    await expect(publicPage.clinicAddress).toBeVisible();
    await expect(publicPage.clinicPhone).toBeVisible();
    await expect(publicPage.clinicEmail).toBeVisible();
    await expect(publicPage.clinicHours).toBeVisible();
  });

  // Verifies the Staff Login nav link opens the login page.
  test('navigates to staff login', async ({ page }) => {
    const publicPage = new PublicPage(page);
    const loginPage = new LoginPage(page);

    await publicPage.open();
    await publicPage.goToLogin();

    await expect(page).toHaveURL(/login\.html/);
    await expect(loginPage.form).toBeVisible();
  });

  // Verifies the Staff Portal button in the welcome section opens the login page.
  test('navigates to staff portal from welcome section', async ({ page }) => {
    const publicPage = new PublicPage(page);
    const loginPage = new LoginPage(page);

    await publicPage.open();
    await page.getByRole('link', { name: 'Staff Portal' }).click();

    await expect(page).toHaveURL(/login\.html/);
    await expect(loginPage.form).toBeVisible();
  });

  // Verifies the Contact nav link scrolls to the contact section.
  test('navigates to contact section', async ({ page }) => {
    const publicPage = new PublicPage(page);

    await publicPage.open();
    await page.getByRole('link', { name: 'Contact', exact: true }).first().click();

    await expect(publicPage.clinicAddress).toBeInViewport();
  });
});
