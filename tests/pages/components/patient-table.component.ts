import type { Locator, Page } from '@playwright/test';

/** Shared patient list table used on admin and staff dashboards. */
export class PatientTableComponent {
  /**
   * @param page - Playwright page that contains the patient table.
   */
  constructor(private readonly page: Page) {}

  /** Patient table element. */
  get table(): Locator {
    return this.page.getByTestId('patient-table');
  }

  /** All patient data rows. */
  get rows(): Locator {
    return this.page.getByTestId('patient-row');
  }

  /**
   * Rows whose text includes `name` (typically `"Last, First"`).
   * @param name - Substring to match in the row.
   */
  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  /**
   * Clicks View on the first row matching `name`.
   * @param name - Patient row label substring.
   */
  async clickViewForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('view-patient').click();
  }

  /**
   * Clicks Add Visit on the first row matching `name`.
   * @param name - Patient row label substring.
   */
  async clickAddVisitForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('add-visit-patient').click();
  }

  /**
   * Clicks Edit on the first row matching `name`.
   * @param name - Patient row label substring.
   */
  async clickEditForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('edit-patient').click();
  }

  /**
   * Clicks Delete on the first row matching `name` (does not handle the confirm dialog).
   * @param name - Patient row label substring.
   */
  async clickDeleteForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('delete-patient').click();
  }
}
