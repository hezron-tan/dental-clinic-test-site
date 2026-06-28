import type { Locator, Page } from '@playwright/test';
import type { VisitHistoryFormData } from '../../models';

export class HistoryFormComponent {
  private readonly formRoot: Page | Locator;
  private readonly listRoot: Page | Locator;

  constructor(page: Page, formScope?: Locator, listScope?: Locator) {
    this.formRoot = formScope ?? page;
    this.listRoot = listScope ?? page;
  }

  get form(): Locator {
    return this.formRoot.getByTestId('history-form');
  }

  get visitDateInput(): Locator {
    return this.formRoot.getByTestId('history-date');
  }

  get procedureSelect(): Locator {
    return this.formRoot.getByTestId('history-procedure');
  }

  get descriptionInput(): Locator {
    return this.formRoot.getByTestId('history-description');
  }

  get dentistInput(): Locator {
    return this.formRoot.getByTestId('history-dentist');
  }

  get addButton(): Locator {
    return this.formRoot.getByTestId('add-history');
  }

  get historyList(): Locator {
    return this.listRoot.getByTestId('history-list');
  }

  get historyEntries(): Locator {
    return this.listRoot.getByTestId('history-entry');
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
