import { type Locator, type Page } from '@playwright/test';
import type { LoginCredentials } from '../models';
import {
  adminEmail,
  adminPassword,
  staffEmail,
  staffPassword
} from '../helpers/supabase';
import { BasePage } from './base.page';

export type LoginRole = 'admin' | 'staff';

const dashboardUrlByRole: Record<LoginRole, RegExp> = {
  admin: /admin\/?/,
  staff: /staff\/?/
};

export class LoginPage extends BasePage {
  readonly path = '/login.html';

  constructor(page: Page) {
    super(page);
  }

  get form(): Locator {
    return this.page.getByTestId('login-form');
  }

  get emailInput(): Locator {
    return this.page.getByTestId('login-email');
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('login-password');
  }

  get submitButton(): Locator {
    return this.page.getByTestId('login-submit');
  }

  get alert(): Locator {
    return this.page.getByTestId('login-alert');
  }

  async open(): Promise<void> {
    await this.goto(this.path);
  }

  async login({ email, password }: LoginCredentials): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAsAdmin(): Promise<void> {
    await this.login({ email: adminEmail, password: adminPassword });
  }

  async loginAsStaff(): Promise<void> {
    await this.login({ email: staffEmail, password: staffPassword });
  }

  async loginExpectingDashboard(role: LoginRole): Promise<void> {
    if (role === 'admin') {
      await this.loginAsAdmin();
    } else {
      await this.loginAsStaff();
    }

    await this.waitForDashboardRedirect(role);
  }

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
