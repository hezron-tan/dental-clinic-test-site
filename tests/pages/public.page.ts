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

  /** Nav control that opens the login page. */
  get navLogin(): Locator {
    return this.page.getByTestId('nav-login');
  }

  /** Opens the public home page. */
  async open(): Promise<void> {
    await this.goto(this.path);
  }

  /** Clicks the nav login control. */
  async goToLogin(): Promise<void> {
    await this.navLogin.click();
  }

  /** Footer/nav link to the staff portal. */
  get staffPortalLink(): Locator {
    return this.page.getByRole('link', { name: 'Staff Portal' });
  }

  /** First exact "Contact" nav link. */
  get contactNavLink(): Locator {
    return this.page.getByRole('link', { name: 'Contact', exact: true }).first();
  }

  /** Navigates via the Staff Portal link. */
  async navToStaffPortal(): Promise<void> {
    await this.staffPortalLink.click();
  }

  /** Clicks Contact in the nav (scrolls/jumps to the contact section). */
  async scrollToContact(): Promise<void> {
    await this.contactNavLink.click();
  }
}
