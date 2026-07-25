import { type Locator, type Page } from '@playwright/test';
import type { DoctorFormData } from '../../models';

/**
 * Shared add/edit doctor form fields.
 * Optionally scoped to an overlay/root locator (e.g. doctor-form-overlay).
 */
export class DoctorFormComponent {
  private readonly root: Page | Locator;

  /**
   * @param page - Playwright page (used when `scope` is omitted).
   * @param scope - Optional root locator that contains the form fields.
   */
  constructor(page: Page, scope?: Locator) {
    this.root = scope ?? page;
  }

  /** Doctor form container. */
  get form(): Locator {
    return this.root.getByTestId('doctor-form');
  }

  /** Doctor display name input. */
  get nameInput(): Locator {
    return this.root.getByTestId('doctor-name');
  }

  /** Doctor description / bio textarea. */
  get descriptionInput(): Locator {
    return this.root.getByTestId('doctor-description');
  }

  /** Profile picture file input. */
  get photoInput(): Locator {
    return this.root.getByTestId('doctor-photo');
  }

  /** Saves the doctor form. */
  get saveButton(): Locator {
    return this.root.getByTestId('save-doctor');
  }

  /**
   * Fills the name field and any optional fields present on `data`.
   * @param data - Doctor form values to enter.
   */
  async fill(data: DoctorFormData): Promise<void> {
    await this.nameInput.fill(data.name);

    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.profilePicturePath !== undefined) {
      await this.photoInput.setInputFiles(data.profilePicturePath);
    }
  }

  /** Clicks the save button. */
  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Fills the form and submits in one step.
   * @param data - Doctor form values to enter and save.
   */
  async fillAndSubmit(data: DoctorFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
