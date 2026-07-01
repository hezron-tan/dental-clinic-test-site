import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class PublicPage extends BasePage {
  readonly path = '/';

  constructor(page: Page) {
    super(page);
  }

  get clinicName(): Locator {
    return this.page.getByTestId('clinic-name');
  }

  get clinicTagline(): Locator {
    return this.page.getByTestId('clinic-tagline');
  }

  get clinicAddress(): Locator {
    return this.page.getByTestId('clinic-address');
  }

  get clinicPhone(): Locator {
    return this.page.getByTestId('clinic-phone');
  }

  get clinicEmail(): Locator {
    return this.page.getByTestId('clinic-email');
  }

  get clinicHours(): Locator {
    return this.page.getByTestId('clinic-hours');
  }

  get navLogin(): Locator {
    return this.page.getByTestId('nav-login');
  }

  async open(): Promise<void> {
    await this.goto(this.path);
  }

  async goToLogin(): Promise<void> {
    await this.navLogin.click();
  }

  get staffPortalLink(): Locator {
    return this.page.getByRole('link', { name: 'Staff Portal' });
  }

  get contactNavLink(): Locator {
    return this.page.getByRole('link', { name: 'Contact', exact: true }).first();
  }

  async navToStaffPortal(): Promise<void> {
    await this.staffPortalLink.click();
  }

  async scrollToContact(): Promise<void> {
    await this.contactNavLink.click();
  }
}
