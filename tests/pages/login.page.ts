import { type Locator, type Page } from '@playwright/test';
import type { LoginCredentials } from '../models';
import {
  adminEmail,
  adminPassword,
  staffEmail,
  staffPassword
} from '../helpers/supabase';
import { BasePage } from './base.page';

/** Clinic role used when logging in and waiting for the matching dashboard. */
export type LoginRole = 'admin' | 'staff';

const dashboardUrlByRole: Record<LoginRole, RegExp> = {
  admin: /admin\/?/,
  staff: /staff\/?/
};

/** Page object for `/login.html`. */
export class LoginPage extends BasePage {
  /** Login page path relative to `baseURL`. */
  readonly path = '/login.html';

  constructor(page: Page) {
    super(page);
  }

  /** Login form container. */
  get form(): Locator {
    return this.page.getByTestId('login-form');
  }

  /** Email field. */
  get emailInput(): Locator {
    return this.page.getByTestId('login-email');
  }

  /** Password field. */
  get passwordInput(): Locator {
    return this.page.getByTestId('login-password');
  }

  /** Submit button. */
  get submitButton(): Locator {
    return this.page.getByTestId('login-submit');
  }

  /** Inline login error/status alert. */
  get alert(): Locator {
    return this.page.getByTestId('login-alert');
  }

  /** Opens the login page. */
  async open(): Promise<void> {
    await this.goto(this.path);
  }

  /**
   * Fills credentials and submits the login form (does not wait for redirect).
   * @param credentials - Email and password to enter.
   */
  async login({ email, password }: LoginCredentials): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Logs in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env. */
  async loginAsAdmin(): Promise<void> {
    await this.login({ email: adminEmail, password: adminPassword });
  }

  /** Logs in with `STAFF_EMAIL` / `STAFF_PASSWORD` from env. */
  async loginAsStaff(): Promise<void> {
    await this.login({ email: staffEmail, password: staffPassword });
  }

  /**
   * Logs in as the given role and waits until the matching dashboard URL loads.
   * @param role - `admin` or `staff` dashboard to expect.
   * @throws When login fails or redirect does not occur in time.
   */
  async loginExpectingDashboard(role: LoginRole): Promise<void> {
    if (role === 'admin') {
      await this.loginAsAdmin();
    } else {
      await this.loginAsStaff();
    }

    await this.waitForDashboardRedirect(role);
  }

  /**
   * Waits for redirect to the role dashboard after a successful login.
   * @param role - Dashboard role whose URL pattern to match.
   * @throws When the alert shows an error, or redirect times out.
   */
  async waitForDashboardRedirect(role: LoginRole): Promise<void> {
    const dashboardUrl = dashboardUrlByRole[role];

    try {
      await this.page.waitForURL(dashboardUrl, { timeout: 15_000 });
    } catch {
      if (await this.alert.isVisible()) {
        throw new Error(`Login failed: ${(await this.alert.textContent())?.trim()}`);
      }
      throw new Error(
        `Login did not redirect to the ${role} dashboard. Check ADMIN_PASSWORD/STAFF_PASSWORD in .env match your Supabase users.`
      );
    }
  }
}
