import { expect, type Locator, type Page } from '@playwright/test';
import type { PatientFormData, VisitHistoryFormData } from '../models';
import { LoginPage } from './login.page';
import { HistoryFormComponent } from './components/history-form.component';
import { PatientFormComponent } from './components/patient-form.component';
import { PatientPaginationComponent } from './components/patient-pagination.component';
import { PatientSearchComponent } from './components/patient-search.component';
import { PatientTableComponent } from './components/patient-table.component';

export class StaffDashboardPage {
  readonly path = '/staff/';

  readonly patientTable: PatientTableComponent;
  readonly patientPagination: PatientPaginationComponent;
  readonly patientSearch: PatientSearchComponent;
  readonly patientForm: PatientFormComponent;
  readonly historyForm: HistoryFormComponent;

  constructor(private readonly page: Page) {
    this.patientTable = new PatientTableComponent(page);
    this.patientPagination = new PatientPaginationComponent(page);
    this.patientSearch = new PatientSearchComponent(page);
    this.patientForm = new PatientFormComponent(page);
    this.historyForm = new HistoryFormComponent(page);
  }

  get logoutButton(): Locator {
    return this.page.getByTestId('logout-btn');
  }

  get userGreeting(): Locator {
    return this.page.getByTestId('user-greeting');
  }

  get alert(): Locator {
    return this.page.getByTestId('staff-alert');
  }

  get addPatientButton(): Locator {
    return this.page.getByTestId('add-patient');
  }

  get patientDetails(): Locator {
    return this.page.getByTestId('patient-details');
  }

  get detailPhone(): Locator {
    return this.page.locator('#detail-phone');
  }

  get addPatientOverlay(): Locator {
    return this.page.getByTestId('add-patient-overlay');
  }

  get addPatientForm(): Locator {
    return this.page.getByTestId('add-patient-form');
  }

  get addPatientFirstNameInput(): Locator {
    return this.addPatientOverlay.getByTestId('add-patient-first-name');
  }

  get addPatientLastNameInput(): Locator {
    return this.addPatientOverlay.getByTestId('add-patient-last-name');
  }

  get addPatientDateOfBirthInput(): Locator {
    return this.addPatientOverlay.getByTestId('add-patient-dob');
  }

  get addPatientEmailInput(): Locator {
    return this.addPatientOverlay.getByTestId('add-patient-email');
  }

  get addPatientPhoneInput(): Locator {
    return this.addPatientOverlay.getByTestId('add-patient-phone');
  }

  get addPatientAddressInput(): Locator {
    return this.addPatientOverlay.getByTestId('add-patient-address');
  }

  get saveNewPatientButton(): Locator {
    return this.addPatientOverlay.getByTestId('save-new-patient');
  }

  get closeAddPatientOverlayButton(): Locator {
    return this.page.getByTestId('close-add-patient-overlay');
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async openViaLogin(loginPage: LoginPage): Promise<void> {
    await loginPage.open();
    await loginPage.loginExpectingDashboard('staff');
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    await expect(this.userGreeting).not.toBeEmpty({ timeout: 15_000 });
    await expect(this.patientPagination.pageInfo).toContainText(/showing|page/i, {
      timeout: 15_000
    });
    await expect(this.addPatientButton).toBeEnabled();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL(/login\.html/, { timeout: 15_000 });
  }

  async openAddPatientModal(): Promise<void> {
    await expect(async () => {
      if (await this.addPatientOverlay.isHidden()) {
        await this.addPatientButton.click();
      }
      await expect(this.addPatientOverlay).toBeVisible();
      await expect(this.addPatientFirstNameInput).toBeVisible();
    }).toPass({ timeout: 15_000 });
  }

  async fillAddPatientForm(data: PatientFormData): Promise<void> {
    await this.addPatientFirstNameInput.fill(data.firstName);
    await this.addPatientLastNameInput.fill(data.lastName);

    if (data.dateOfBirth !== undefined) {
      await this.addPatientDateOfBirthInput.fill(data.dateOfBirth);
    }
    if (data.email !== undefined) {
      await this.addPatientEmailInput.fill(data.email);
    }
    if (data.phone !== undefined) {
      await this.addPatientPhoneInput.fill(data.phone);
    }
    if (data.address !== undefined) {
      await this.addPatientAddressInput.fill(data.address);
    }
  }

  async submitAddPatientForm(): Promise<void> {
    await this.saveNewPatientButton.click();
  }

  async addPatient(data: PatientFormData): Promise<void> {
    await this.openAddPatientModal();
    await this.fillAddPatientForm(data);
    await this.submitAddPatientForm();
  }

  async closeAddPatientModal(): Promise<void> {
    await this.closeAddPatientOverlayButton.click();
  }

  async openPatientDetails(name: string): Promise<void> {
    await this.patientTable.clickEditForPatient(name);
  }

  async updatePatient(data: PatientFormData): Promise<void> {
    await this.patientForm.fillAndSubmit(data);
  }

  async addVisitHistory(data: VisitHistoryFormData): Promise<void> {
    await this.historyForm.fillAndSubmit(data);
  }
}
