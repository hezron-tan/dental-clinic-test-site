import type { Locator, Page } from '@playwright/test';
import type { PatientFormData } from '../../models';

export class PatientFormComponent {
  constructor(private readonly page: Page) {}

  get form(): Locator {
    return this.page.getByTestId('patient-form');
  }

  get firstNameInput(): Locator {
    return this.page.getByTestId('patient-first-name');
  }

  get lastNameInput(): Locator {
    return this.page.getByTestId('patient-last-name');
  }

  get dateOfBirthInput(): Locator {
    return this.page.getByTestId('patient-dob');
  }

  get emailInput(): Locator {
    return this.page.getByTestId('patient-email');
  }

  get phoneInput(): Locator {
    return this.page.getByTestId('patient-phone');
  }

  get addressInput(): Locator {
    return this.page.getByTestId('patient-address');
  }

  get saveButton(): Locator {
    return this.page.getByTestId('save-patient');
  }

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

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async fillAndSubmit(data: PatientFormData): Promise<void> {
    await this.fill(data);
    await this.submit();
  }
}
