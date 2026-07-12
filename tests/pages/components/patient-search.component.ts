import { type Locator, type Page } from '@playwright/test';
import type { PatientSearchCriteria } from '../../models';

/**
 * Patient search form (name and/or date of birth).
 * Optionally scoped to a panel (e.g. admin patients tab).
 */
export class PatientSearchComponent {
  private readonly root: Page | Locator;

  /**
   * @param page - Playwright page (used when `scope` is omitted).
   * @param scope - Optional root locator that contains the search form and rows.
   */
  constructor(page: Page, scope?: Locator) {
    this.root = scope ?? page;
  }

  /** Search form container. */
  get form(): Locator {
    return this.root.getByTestId('patient-search');
  }

  get nameInput(): Locator {
    return this.root.getByTestId('search-name');
  }

  get dateOfBirthInput(): Locator {
    return this.root.getByTestId('search-dob');
  }

  /** Runs the current search criteria. */
  get searchButton(): Locator {
    return this.root.getByTestId('search-patients');
  }

  /** Clears search fields and resets results. */
  get clearButton(): Locator {
    return this.root.getByTestId('clear-search');
  }

  /**
   * First patient row under this search root whose text includes `name`.
   * @param name - Substring to match in the row.
   */
  rowByName(name: string): Locator {
    return this.root.getByTestId('patient-row').filter({ hasText: name }).first();
  }

  /**
   * Fills provided criteria and clicks Search.
   * @param criteria - Name and/or date of birth filters.
   */
  async search(criteria: PatientSearchCriteria): Promise<void> {
    if (criteria.name !== undefined) {
      await this.nameInput.fill(criteria.name);
    }
    if (criteria.dateOfBirth !== undefined) {
      await this.dateOfBirthInput.fill(criteria.dateOfBirth);
    }
    await this.searchButton.click();
  }

  /**
   * Searches by name only.
   * @param name - Name query to enter.
   */
  async searchByName(name: string): Promise<void> {
    await this.search({ name });
  }

  /**
   * Clears the name field, then searches by date of birth only.
   * @param dob - Date of birth in the format expected by the search form.
   */
  async searchByDateOfBirth(dob: string): Promise<void> {
    await this.nameInput.fill('');
    await this.search({ dateOfBirth: dob });
  }

  /** Clicks Clear to reset the search form. */
  async clear(): Promise<void> {
    await this.clearButton.click();
  }
}
