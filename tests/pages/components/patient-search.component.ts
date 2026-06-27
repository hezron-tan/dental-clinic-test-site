import type { Locator, Page } from '@playwright/test';
import type { PatientSearchCriteria } from '../../models';

export class PatientSearchComponent {
  constructor(private readonly page: Page) {}

  get form(): Locator {
    return this.page.getByTestId('patient-search');
  }

  get nameInput(): Locator {
    return this.page.getByTestId('search-name');
  }

  get dateOfBirthInput(): Locator {
    return this.page.getByTestId('search-dob');
  }

  get searchButton(): Locator {
    return this.page.getByTestId('search-patients');
  }

  get clearButton(): Locator {
    return this.page.getByTestId('clear-search');
  }

  async search(criteria: PatientSearchCriteria): Promise<void> {
    if (criteria.name !== undefined) {
      await this.nameInput.fill(criteria.name);
    }
    if (criteria.dateOfBirth !== undefined) {
      await this.dateOfBirthInput.fill(criteria.dateOfBirth);
    }
    await this.searchButton.click();
  }

  async searchByName(name: string): Promise<void> {
    await this.search({ name });
  }

  async searchByDateOfBirth(dob: string): Promise<void> {
    await this.search({ dateOfBirth: dob });
  }

  async clear(): Promise<void> {
    await this.clearButton.click();
  }
}
