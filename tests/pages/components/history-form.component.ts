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

  /** Dentist dropdown populated from the doctors table. */
  get dentistSelect(): Locator {
    return this.formRoot.getByTestId('history-dentist');
  }

  /** @deprecated Prefer {@link dentistSelect}. */
  get dentistInput(): Locator {
    return this.dentistSelect;
  }

  /** Inline error under the visit date field. */
  get visitDateError(): Locator {
    return this.formRoot.getByTestId('history-date-error');
  }

  /** Inline error under the procedure type field. */
  get procedureError(): Locator {
    return this.formRoot.getByTestId('history-procedure-error');
  }

  /** Inline error under the description field. */
  get descriptionError(): Locator {
    return this.formRoot.getByTestId('history-description-error');
  }

  /** Inline error under the dentist field. */
  get dentistError(): Locator {
    return this.formRoot.getByTestId('history-dentist-error');
  }

  /** Notes textarea (optional). */
  get notesInput(): Locator {
    return this.formRoot.getByTestId('history-notes');
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
   * Returns non-empty dentist option labels from the doctors dropdown.
   * @returns Dentist display names available for selection.
   */
  async dentistOptionLabels(): Promise<string[]> {
    const options = this.dentistSelect.locator('option:not([value=""])');
    const count = await options.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const text = (await options.nth(i).textContent())?.trim();
      if (text) labels.push(text);
    }
    return labels;
  }

  /**
   * Selects the first available dentist option (skips the empty placeholder).
   * @returns The selected dentist name.
   */
  async selectFirstDentist(): Promise<string> {
    const options = this.dentistSelect.locator('option:not([value=""])');
    const count = await options.count();
    if (count === 0) {
      throw new Error('No dentists available in the dropdown. Seed doctors first.');
    }
    const value = await options.first().getAttribute('value');
    await this.dentistSelect.selectOption(value!);
    return value!;
  }

  /**
   * Clears all required add-visit fields so client-side validation can be asserted.
   * Leaves notes untouched.
   */
  async clearRequiredFields(): Promise<void> {
    await this.visitDateInput.fill('');
    await this.procedureSelect.selectOption('');
    await this.descriptionInput.fill('');
    await this.dentistSelect.selectOption('');
  }

  /**
   * Fills required visit fields and any optional fields present on `data`.
   * Dentist defaults to the first doctor in the list when not provided.
   * @param data - Visit history form values to enter.
   */
  async fill(data: VisitHistoryFormData): Promise<void> {
    await this.visitDateInput.fill(data.visitDate);
    await this.procedureSelect.selectOption(data.procedure);

    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.dentist !== undefined && data.dentist !== '') {
      await this.dentistSelect.selectOption({ label: data.dentist });
    } else {
      await this.selectFirstDentist();
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
