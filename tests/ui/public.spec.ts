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

  test('Verify that the contact nav link scrolls to the contact section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.scrollToContact();

    await expect(publicPage.clinicAddress).toBeInViewport();
  });
});

test.describe('Public clinic site - card navigation', () => {
  test('Verify that the card navigation menu is collapsed by default', async ({ publicPage }) => {
    await publicPage.open();

    await expect(publicPage.menuToggle).toBeVisible();
    expect(await publicPage.isMenuExpanded()).toBe(false);
    await expect(publicPage.cardNavContent).toHaveAttribute('aria-hidden', 'true');
  });

  test('Verify that the hamburger toggle expands and collapses the card menu', async ({ publicPage }) => {
    await publicPage.open();

    await publicPage.openMenu();
    expect(await publicPage.isMenuExpanded()).toBe(true);
    await expect(publicPage.cardNavContent).toHaveAttribute('aria-hidden', 'false');
    await expect(publicPage.navLogin).toBeVisible();

    await publicPage.closeMenu();
    expect(await publicPage.isMenuExpanded()).toBe(false);
    await expect(publicPage.cardNavContent).toHaveAttribute('aria-hidden', 'true');
  });

  test('Verify that the card menu exposes the primary navigation links', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.openMenu();

    await expect(publicPage.navHome).toBeVisible();
    await expect(publicPage.navServices).toBeVisible();
    await expect(publicPage.navOfficeHours).toBeVisible();
    await expect(publicPage.navContact).toBeVisible();
    await expect(publicPage.navCall).toHaveAttribute('href', /^tel:/);
    await expect(publicPage.navEmail).toHaveAttribute('href', /^mailto:/);
  });

  test('Verify that the Services menu link scrolls to the services section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.goToServicesViaMenu();

    await expect(publicPage.servicesSection).toBeInViewport();
    expect(await publicPage.isMenuExpanded()).toBe(false);
  });

  test('Verify that the Office Hours menu link scrolls to the hours section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.goToOfficeHoursViaMenu();

    await expect(publicPage.hoursSection).toBeInViewport();
    await expect(publicPage.clinicHours).toBeInViewport();
  });
});

test.describe('Public clinic site - banner and content', () => {
  test('Verify that the banner Services button scrolls to the services section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.goToServicesViaBanner();

    await expect(publicPage.servicesSection).toBeInViewport();
  });

  test('Verify that the banner Contact Us button scrolls to the contact section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.goToContactViaBanner();

    await expect(publicPage.clinicAddress).toBeInViewport();
  });

  test('Verify that the Get in Touch CTA scrolls to the contact section', async ({ publicPage }) => {
    await publicPage.open();
    await publicPage.clickGetInTouch();

    await expect(publicPage.clinicAddress).toBeInViewport();
  });

  test('Verify that the services section lists the clinic offerings', async ({ publicPage }) => {
    await publicPage.open();

    await expect(publicPage.servicesSection).toBeVisible();
    await expect(publicPage.serviceCards).toHaveCount(3);
    await expect(publicPage.serviceCards.filter({ hasText: 'Preventive Care' })).toBeVisible();
    await expect(publicPage.serviceCards.filter({ hasText: 'Restorative Dentistry' })).toBeVisible();
    await expect(publicPage.serviceCards.filter({ hasText: 'Cosmetic Dentistry' })).toBeVisible();
  });

  test('Verify that the welcome gallery displays clinic imagery', async ({ publicPage }) => {
    await publicPage.open();

    await expect(publicPage.welcomeSection).toBeVisible();
    await expect(publicPage.welcomeGalleryImages).toHaveCount(3);
    await expect(publicPage.welcomeGalleryImages.first()).toBeVisible();
  });

  test('Verify that the floating-lines banner background is rendered', async ({ publicPage }) => {
    await publicPage.open();

    await expect(publicPage.bannerCanvas).toBeAttached();
  });
});
