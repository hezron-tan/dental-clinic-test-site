import { expect, test } from '../fixtures';

test.describe('Public clinic site', () => {
  test('Verify that the public site displays clinic name and contact info', async ({ publicPage }) => {
    await publicPage.open();

    await expect(publicPage.clinicName).toBeVisible();
    await expect(publicPage.clinicTagline).toBeVisible();
    await expect(publicPage.clinicAddress).toBeVisible();
    await expect(publicPage.clinicPhone).toBeVisible();
    await expect(publicPage.clinicEmail).toBeVisible();
    await expect(publicPage.clinicHours).toBeVisible();
  });

  test('Verify that the public site navigates to staff login', async ({ publicPage, loginPage, page }) => {
    await publicPage.open();
    await publicPage.goToLogin();

    await expect(page).toHaveURL(/login\.html/);
    await expect(loginPage.form).toBeVisible();
  });

  test('Verify that the welcome section navigates to the staff portal', async ({ publicPage, loginPage, page }) => {
    await publicPage.open();
    await publicPage.navToStaffPortal();

    await expect(page).toHaveURL(/login\.html/);
    await expect(loginPage.form).toBeVisible();
  });

  test('Verify that the contact nav link scrolls to the contact section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.scrollToContact();

    await expect(publicPage.clinicAddress).toBeInViewport();
  });
});
