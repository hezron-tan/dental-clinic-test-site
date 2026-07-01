import { expect, test } from '../fixtures';

test.describe('Public clinic site', () => {
  test('displays clinic name and contact info', async ({ publicPage }) => {
    await publicPage.open();

    await expect(publicPage.clinicName).toBeVisible();
    await expect(publicPage.clinicTagline).toBeVisible();
    await expect(publicPage.clinicAddress).toBeVisible();
    await expect(publicPage.clinicPhone).toBeVisible();
    await expect(publicPage.clinicEmail).toBeVisible();
    await expect(publicPage.clinicHours).toBeVisible();
  });

  test('navigates to staff login', async ({ publicPage, loginPage, page }) => {
    await publicPage.open();
    await publicPage.goToLogin();

    await expect(page).toHaveURL(/login\.html/);
    await expect(loginPage.form).toBeVisible();
  });

  test('navigates to staff portal from welcome section', async ({ publicPage, loginPage, page }) => {
    await publicPage.open();
    await publicPage.navToStaffPortal();

    await expect(page).toHaveURL(/login\.html/);
    await expect(loginPage.form).toBeVisible();
  });

  test('navigates to contact section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.scrollToContact();

    await expect(publicPage.clinicAddress).toBeInViewport();
  });
});
