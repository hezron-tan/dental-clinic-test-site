import type { Locator, Page } from '@playwright/test';

export class PatientPaginationComponent {
  constructor(private readonly page: Page) {}

  get bar(): Locator {
    return this.page.getByTestId('patient-pagination');
  }

  get prevButton(): Locator {
    return this.page.getByTestId('prev-page');
  }

  get nextButton(): Locator {
    return this.page.getByTestId('next-page');
  }

  get pageInfo(): Locator {
    return this.page.getByTestId('page-info');
  }

  async goToNextPage(): Promise<void> {
    await this.nextButton.click();
  }

  async goToPreviousPage(): Promise<void> {
    await this.prevButton.click();
  }

  async totalPages(): Promise<number> {
    const text = await this.pageInfo.textContent();
    const match = text?.match(/Page \d+ of (\d+)/i);
    return match ? Number.parseInt(match[1], 10) : 1;
  }

  async hasMultiplePages(): Promise<boolean> {
    return (await this.totalPages()) > 1;
  }
}
