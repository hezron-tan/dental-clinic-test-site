import { expect, type Locator, type Page } from '@playwright/test';
import type { ClinicFormData, PatientFormData } from '../models';
import { LoginPage } from './login.page';
import { PatientFormComponent } from './components/patient-form.component';
import { PatientPaginationComponent } from './components/patient-pagination.component';
import { PatientTableComponent } from './components/patient-table.component';

export class AdminDashboardPage {
  readonly path = '/admin/';

  readonly patientTable: PatientTableComponent;
  readonly patientPagination: PatientPaginationComponent;
  readonly patientForm: PatientFormComponent;

  constructor(private readonly page: Page) {
    this.patientTable = new PatientTableComponent(page);
    this.patientPagination = new PatientPaginationComponent(page);
    this.patientForm = new PatientFormComponent(page);
  }

  get logoutButton(): Locator {
    return this.page.getByTestId('logout-btn');
  }

  get userGreeting(): Locator {
    return this.page.getByTestId('user-greeting');
  }

  get alert(): Locator {
    return this.page.getByTestId('admin-alert');
  }

  get storageWarning(): Locator {
    return this.page.getByTestId('storage-warning');
  }

  get tabs(): Locator {
    return this.page.getByTestId('admin-tabs');
  }

  get clinicTab(): Locator {
    return this.page.getByTestId('tab-clinic');
  }

  get patientsTab(): Locator {
    return this.page.getByTestId('tab-patients');
  }

  get clinicPanel(): Locator {
    return this.page.getByTestId('tab-panel-clinic');
  }

  get patientsPanel(): Locator {
    return this.page.getByTestId('tab-panel-patients');
  }

  get clinicForm(): Locator {
    return this.page.getByTestId('clinic-form');
  }

  get clinicNameInput(): Locator {
    return this.page.getByTestId('clinic-name-input');
  }

  get clinicTaglineInput(): Locator {
    return this.page.getByTestId('clinic-tagline-input');
  }

  get clinicAddressInput(): Locator {
    return this.page.getByTestId('clinic-address-input');
  }

  get clinicPhoneInput(): Locator {
    return this.page.getByTestId('clinic-phone-input');
  }

  get clinicEmailInput(): Locator {
    return this.page.getByTestId('clinic-email-input');
  }

  get clinicHoursInput(): Locator {
    return this.page.getByTestId('clinic-hours-input');
  }

  get saveClinicButton(): Locator {
    return this.page.getByTestId('save-clinic');
  }

  get addPatientButton(): Locator {
    return this.page.getByTestId('add-patient');
  }

  get patientFormOverlay(): Locator {
    return this.page.getByTestId('patient-form-overlay');
  }

  get closePatientOverlayButton(): Locator {
    return this.page.getByTestId('close-patient-overlay');
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async openViaLogin(loginPage: LoginPage): Promise<void> {
    await loginPage.open();
    await loginPage.loginExpectingDashboard('admin');
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async showClinicTab(): Promise<void> {
    await this.clinicTab.click();
  }

  async showPatientsTab(): Promise<void> {
    await this.patientsTab.click();
  }

  async waitForClinicFormLoaded(): Promise<void> {
    await expect(this.clinicNameInput).not.toBeEmpty({ timeout: 10_000 });
  }

  async fillClinicForm(data: ClinicFormData): Promise<void> {
    if (data.name !== undefined) {
      await this.clinicNameInput.fill(data.name);
    }
    if (data.tagline !== undefined) {
      await this.clinicTaglineInput.fill(data.tagline);
    }
    if (data.address !== undefined) {
      await this.clinicAddressInput.fill(data.address);
    }
    if (data.phone !== undefined) {
      await this.clinicPhoneInput.fill(data.phone);
    }
    if (data.email !== undefined) {
      await this.clinicEmailInput.fill(data.email);
    }
    if (data.hours !== undefined) {
      await this.clinicHoursInput.fill(data.hours);
    }
  }

  async saveClinicInfo(): Promise<void> {
    await this.saveClinicButton.click();
    await expect(this.alert).toContainText(/saved/i, { timeout: 10_000 });
  }

  async updateClinicInfo(data: ClinicFormData): Promise<void> {
    await this.waitForClinicFormLoaded();
    await this.fillClinicForm(data);
    await this.saveClinicInfo();
  }

  async openAddPatientModal(): Promise<void> {
    await this.showPatientsTab();
    await this.addPatientButton.click();
  }

  async addPatient(data: PatientFormData): Promise<void> {
    await this.openAddPatientModal();
    await this.patientForm.fillAndSubmit(data);
  }

  async closePatientModal(): Promise<void> {
    await this.closePatientOverlayButton.click();
  }
}
