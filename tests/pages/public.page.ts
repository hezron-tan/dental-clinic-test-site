import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/** Page object for the public marketing site (`/`). */
export class PublicPage extends BasePage {
  /** Public home path relative to `baseURL`. */
  readonly path = '/';

  constructor(page: Page) {
    super(page);
  }

  /** Clinic display name on the public site. */
  get clinicName(): Locator {
    return this.page.getByTestId('clinic-name');
  }

  /** Clinic tagline. */
  get clinicTagline(): Locator {
    return this.page.getByTestId('clinic-tagline');
  }

  /** Clinic address in contact/info content. */
  get clinicAddress(): Locator {
    return this.page.getByTestId('clinic-address');
  }

  /** Clinic phone number. */
  get clinicPhone(): Locator {
    return this.page.getByTestId('clinic-phone');
  }

  /** Clinic email address. */
  get clinicEmail(): Locator {
    return this.page.getByTestId('clinic-email');
  }

  /** Clinic hours text. */
  get clinicHours(): Locator {
    return this.page.getByTestId('clinic-hours');
  }

  /** Nav control that opens the login page (lives inside the card menu). */
  get navLogin(): Locator {
    return this.page.getByTestId('nav-login');
  }

  /** Card navigation bar element in the banner. */
  get cardNav(): Locator {
    return this.page.locator('#card-nav .card-nav');
  }

  /** Hamburger control that expands/collapses the card navigation. */
  get menuToggle(): Locator {
    return this.page.locator('.hamburger-menu');
  }

  /** Expandable content region that holds the navigation cards. */
  get cardNavContent(): Locator {
    return this.page.locator('.card-nav-content');
  }

  /** Logo link inside the card navigation bar. */
  get cardNavLogo(): Locator {
    return this.page.locator('.cardnav-logo');
  }

  /** Primary "Get in Touch" CTA button in the card navigation bar. */
  get getInTouchButton(): Locator {
    return this.page.locator('.card-nav-cta-button');
  }

  /** "Home" link inside the card menu. */
  get navHome(): Locator {
    return this.cardNavContent.getByRole('link', { name: 'Home' });
  }

  /** "Services" link inside the card menu. */
  get navServices(): Locator {
    return this.cardNavContent.getByRole('link', { name: 'Services' });
  }

  /** "Office Hours" link inside the card menu. */
  get navOfficeHours(): Locator {
    return this.cardNavContent.getByRole('link', { name: 'Office Hours' });
  }

  /** "Contact Us" link inside the card menu. */
  get navContact(): Locator {
    return this.cardNavContent.getByRole('link', { name: 'Contact Us' });
  }

  /** "Call Us" (tel:) link inside the card menu. */
  get navCall(): Locator {
    return this.cardNavContent.getByRole('link', { name: 'Call Us' });
  }

  /** "Email Us" (mailto:) link inside the card menu. */
  get navEmail(): Locator {
    return this.cardNavContent.getByRole('link', { name: 'Email Us' });
  }

  /** Banner hero action buttons container. */
  get bannerActions(): Locator {
    return this.page.locator('.banner-actions');
  }

  /** "Services" button in the banner hero. */
  get bannerServicesButton(): Locator {
    return this.bannerActions.getByRole('link', { name: 'Services' });
  }

  /** "Contact Us" button in the banner hero. */
  get bannerContactButton(): Locator {
    return this.bannerActions.getByRole('link', { name: 'Contact Us' });
  }

  /** Welcome section. */
  get welcomeSection(): Locator {
    return this.page.locator('#welcome');
  }

  /** Images shown in the welcome gallery. */
  get welcomeGalleryImages(): Locator {
    return this.page.locator('#welcome .welcome-gallery img');
  }

  /** Services ("What We Offer") section. */
  get servicesSection(): Locator {
    return this.page.locator('#services');
  }

  /** Individual service offering cards. */
  get serviceCards(): Locator {
    return this.page.locator('#services .box.highlight');
  }

  /** Office hours section. */
  get hoursSection(): Locator {
    return this.page.locator('#hours');
  }

  /** Animated floating-lines canvas rendered into the banner. */
  get bannerCanvas(): Locator {
    return this.page.locator('#banner canvas.floating-lines-canvas');
  }

  /** First exact "Contact" nav link (footer quick links). */
  get contactNavLink(): Locator {
    return this.page.getByRole('link', { name: 'Contact', exact: true }).first();
  }

  /** Opens the public home page. */
  async open(): Promise<void> {
    await this.goto(this.path);
  }

  /**
   * Reports whether the card navigation menu is currently expanded.
   * @returns {Promise<boolean>} `true` when the menu is open.
   */
  async isMenuExpanded(): Promise<boolean> {
    return (await this.menuToggle.getAttribute('aria-expanded')) === 'true';
  }

  /** Expands the card navigation menu if it is currently collapsed. */
  async openMenu(): Promise<void> {
    if (!(await this.isMenuExpanded())) {
      await this.menuToggle.click();
      await this.page.locator('.hamburger-menu[aria-expanded="true"]').waitFor();
    }
  }

  /** Collapses the card navigation menu if it is currently expanded. */
  async closeMenu(): Promise<void> {
    if (await this.isMenuExpanded()) {
      await this.menuToggle.click();
      await this.page.locator('.hamburger-menu[aria-expanded="false"]').waitFor();
    }
  }

  /** Opens the menu (if needed) and clicks the nav login control. */
  async goToLogin(): Promise<void> {
    await this.openMenu();
    await this.navLogin.click();
  }

  /** Opens the menu (if needed) and clicks the "Services" nav link. */
  async goToServicesViaMenu(): Promise<void> {
    await this.openMenu();
    await this.navServices.click();
  }

  /** Opens the menu (if needed) and clicks the "Office Hours" nav link. */
  async goToOfficeHoursViaMenu(): Promise<void> {
    await this.openMenu();
    await this.navOfficeHours.click();
  }

  /** Clicks the banner hero "Services" button. */
  async goToServicesViaBanner(): Promise<void> {
    await this.bannerServicesButton.click();
  }

  /** Clicks the banner hero "Contact Us" button. */
  async goToContactViaBanner(): Promise<void> {
    await this.bannerContactButton.click();
  }

  /** Clicks the "Get in Touch" CTA button in the card navigation bar. */
  async clickGetInTouch(): Promise<void> {
    await this.getInTouchButton.click();
  }

  /** Clicks Contact in the footer quick links (scrolls/jumps to the contact section). */
  async scrollToContact(): Promise<void> {
    await this.contactNavLink.click();
  }
}
