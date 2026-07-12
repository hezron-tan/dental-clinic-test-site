import type { Locator, Page } from '@playwright/test';
import type { VisitHistoryFormData } from '../../models';

/**
 * Visit history add form and history list.
 * Form and list can be scoped to different overlays (add-visit vs view-patient).
 */
export class HistoryFormComponent {
  private readonly formRoot: Page | Locator;
  private readonly listRoot: Page | Locator;

  /**
   * @param page - Playwright page (used when scopes are omitted).
   * @param formScope - Root that contains the add-history form fields.
   * @param listScope - Root that contains the history list entries.
   */
  constructor(page: Page, formScope?: Locator, listScope?: Locator) {
    this.formRoot = formScope ?? page;
    this.listRoot = listScope ?? page;
  }

  /** Add visit history form. */
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

  /** Submits a new history entry. */
  get addButton(): Locator {
    return this.formRoot.getByTestId('add-history');
  }

  /** List container of existing visit history entries. */
  get historyList(): Locator {
    return this.listRoot.getByTestId('history-list');
  }

  /** Individual history entry rows. */
  get historyEntries(): Locator {
    return this.listRoot.getByTestId('history-entry');
  }

  /**
   * Fills required visit fields and any optional fields present on `data`.
   * @param data - Visit history form values to enter.
   */
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

  /** Clicks Add to submit the history form. */
  async submit(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * Fills the history form and submits in one step.
   * @param data - Visit history form values to enter and save.
   */
  async fillAndSubmit(data: VisitHistoryFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
