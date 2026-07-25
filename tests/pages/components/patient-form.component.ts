import { type Locator, type Page } from '@playwright/test';
import type { PatientFormData } from '../../models';

/**
 * Shared add/edit patient form fields.
 * Optionally scoped to an overlay/root locator (e.g. patient-form-overlay).
 */
export class PatientFormComponent {
  private readonly root: Page | Locator;

  /**
   * @param page - Playwright page (used when `scope` is omitted).
   * @param scope - Optional root locator that contains the form fields.
   */
  constructor(page: Page, scope?: Locator) {
    this.root = scope ?? page;
  }

  /** Patient form container. */
  get form(): Locator {
    return this.root.getByTestId('patient-form');
  }

  get firstNameInput(): Locator {
    return this.root.getByTestId('patient-first-name');
  }

  get lastNameInput(): Locator {
    return this.root.getByTestId('patient-last-name');
  }

  get dateOfBirthInput(): Locator {
    return this.root.getByTestId('patient-dob');
  }

  get emailInput(): Locator {
    return this.root.getByTestId('patient-email');
  }

  get phoneInput(): Locator {
    return this.root.getByTestId('patient-phone');
  }

  get addressInput(): Locator {
    return this.root.getByTestId('patient-address');
  }

  /** Saves the patient form. */
  get saveButton(): Locator {
    return this.root.getByTestId('save-patient');
  }

  /**
   * Fills required name fields and any optional fields present on `data`.
   * @param data - Patient form values to enter.
   */
  async fill(data: PatientFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);

    if (data.dateOfBirth !== undefined) {
      await this.dateOfBirthInput.fill(data.dateOfBirth);
    }
    if (data.email !== undefined) {
      await this.emailInput.fill(data.email);
    }
    if (data.phone !== undefined) {
      await this.phoneInput.fill(data.phone);
    }
    if (data.address !== undefined) {
      await this.addressInput.fill(data.address);
    }
  }

  /** Clicks the save button. */
  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Fills the form and submits in one step.
   * @param data - Patient form values to enter and save.
   */
  async fillAndSubmit(data: PatientFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
