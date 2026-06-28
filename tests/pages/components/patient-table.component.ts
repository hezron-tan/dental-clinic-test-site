import type { Locator, Page } from '@playwright/test';

export class PatientTableComponent {
  constructor(private readonly page: Page) {}

  get table(): Locator {
    return this.page.getByTestId('patient-table');
  }

  get rows(): Locator {
    return this.page.getByTestId('patient-row');
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async clickViewForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('view-patient').click();
  }

  async clickAddVisitForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('add-visit-patient').click();
  }

  async clickEditForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('edit-patient').click();
  }

  async clickDeleteForPatient(name: string): Promise<void> {
    await this.rowByName(name).first().getByTestId('delete-patient').click();
  }
}
