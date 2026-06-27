import { expect, type Locator, type Page } from '@playwright/test';
import type { PatientSearchCriteria } from '../../models';

export class PatientSearchComponent {
  constructor(
    private readonly page: Page,
    private readonly root: Locator = page
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

  async search(criteria: PatientSearchCriteria): Promise<void> {
    if (criteria.name !== undefined) {
      await this.nameInput.fill(criteria.name);
    }
    if (criteria.dateOfBirth !== undefined) {
      await this.dateOfBirthInput.fill(criteria.dateOfBirth);
    }
    await this.form.evaluate((form) => (form as HTMLFormElement).requestSubmit());
  }

  async searchByName(name: string): Promise<void> {
    await this.search({ name });
    await expect(this.root.getByTestId('patient-row').filter({ hasText: name }).first()).toBeVisible({
      timeout: 10_000
    });
  }

  async searchByDateOfBirth(dob: string): Promise<void> {
    await this.search({ dateOfBirth: dob });
  }

  async clear(): Promise<void> {
    await this.clearButton.click();
  }
}
