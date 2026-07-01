import { type Locator, type Page } from '@playwright/test';
import type { PatientSearchCriteria } from '../../models';

export class PatientSearchComponent {
  constructor(
    _page: Page,
    private readonly root: Locator = _page
  ) {}
  get form(): Locator {
    return this.root.getByTestId('patient-search');
  }

  get nameInput(): Locator {
    return this.root.getByTestId('search-name');
  }

  get dateOfBirthInput(): Locator {
    return this.root.getByTestId('search-dob');
  }

  get searchButton(): Locator {
    return this.root.getByTestId('search-patients');
  }

  get clearButton(): Locator {
    return this.root.getByTestId('clear-search');
  }

  rowByName(name: string): Locator {
    return this.root.getByTestId('patient-row').filter({ hasText: name }).first();
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
    await this.nameInput.fill('');
    await this.search({ dateOfBirth: dob });
  }

  async clear(): Promise<void> {
    await this.clearButton.click();
  }
}
