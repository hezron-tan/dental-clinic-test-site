import type { Locator, Page } from '@playwright/test';
import type { VisitHistoryFormData } from '../../models';

export class HistoryFormComponent {
  constructor(private readonly page: Page) {}

  get form(): Locator {
    return this.page.getByTestId('history-form');
  }

  get visitDateInput(): Locator {
    return this.page.getByTestId('history-date');
  }

  get procedureSelect(): Locator {
    return this.page.getByTestId('history-procedure');
  }

  get descriptionInput(): Locator {
    return this.page.getByTestId('history-description');
  }

  get dentistInput(): Locator {
    return this.page.getByTestId('history-dentist');
  }

  get addButton(): Locator {
    return this.page.getByTestId('add-history');
  }

  get historyList(): Locator {
    return this.page.getByTestId('history-list');
  }

  get historyEntries(): Locator {
    return this.page.getByTestId('history-entry');
  }

  async fill(data: VisitHistoryFormData): Promise<void> {
    await this.visitDateInput.fill(data.visitDate);
    await this.procedureSelect.selectOption(data.procedure);

    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.dentist !== undefined) {
      await this.dentistInput.fill(data.dentist);
    }
  }

  async submit(): Promise<void> {
    await this.addButton.click();
  }

  async fillAndSubmit(data: VisitHistoryFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
