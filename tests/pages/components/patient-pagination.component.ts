import type { Locator, Page } from '@playwright/test';

/** Shared first/prev/next/last pagination controls for the patient list. */
export class PatientPaginationComponent {
  /**
   * @param page - Playwright page that contains pagination.
   */
  constructor(private readonly page: Page) {}

  /** Pagination bar container. */
  get bar(): Locator {
    return this.page.getByTestId('patient-pagination');
  }

  /** Go to the first page. */
  get firstButton(): Locator {
    return this.page.getByTestId('first-page');
  }

  /** Go to previous page. */
  get prevButton(): Locator {
    return this.page.getByTestId('prev-page');
  }

  /** Go to next page. */
  get nextButton(): Locator {
    return this.page.getByTestId('next-page');
  }

  /** Go to the last page. */
  get lastButton(): Locator {
    return this.page.getByTestId('last-page');
  }

  /** Text such as "Page 1 of 3" or "Showing …". */
  get pageInfo(): Locator {
    return this.page.getByTestId('page-info');
  }

  /** Clicks the first-page control. */
  async goToFirstPage(): Promise<void> {
    await this.firstButton.click();
  }

  /** Clicks the next-page control. */
  async goToNextPage(): Promise<void> {
    await this.nextButton.click();
  }

  /** Clicks the previous-page control. */
  async goToPreviousPage(): Promise<void> {
    await this.prevButton.click();
  }

  /** Clicks the last-page control. */
  async goToLastPage(): Promise<void> {
    await this.lastButton.click();
  }

  /**
   * Parses total page count from {@link pageInfo} (`Page N of M`).
   * @returns Total pages, or `1` when the pattern is missing.
   */
  async totalPages(): Promise<number> {
    const text = await this.pageInfo.textContent();
    const match = text?.match(/Page \d+ of (\d+)/i);
    return match ? Number.parseInt(match[1], 10) : 1;
  }

  /**
   * Whether the patient list spans more than one page.
   * Useful for skipping pagination tests when seed data is small.
   */
  async hasMultiplePages(): Promise<boolean> {
    return (await this.totalPages()) > 1;
  }
}
