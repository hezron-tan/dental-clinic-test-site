import type { Page } from '@playwright/test';

/** Shared base for page objects: holds the Playwright {@link Page} and navigation helper. */
export abstract class BasePage {
  /**
   * @param page - Playwright page for this page object.
   */
  constructor(protected readonly page: Page) {}

  /**
   * Navigates to a path relative to the Playwright `baseURL`.
   * @param path - App path such as `/login.html` or `/admin/`.
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
