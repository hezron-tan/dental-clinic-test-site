import { expect, type Locator, type Page } from '@playwright/test';
import type { ClinicFormData, PatientFormData } from '../models';
import { LoginPage } from './login.page';
import { PatientFormComponent } from './components/patient-form.component';
import { PatientPaginationComponent } from './components/patient-pagination.component';
import { PatientSearchComponent } from './components/patient-search.component';
import { PatientTableComponent } from './components/patient-table.component';

export class AdminDashboardPage {
  readonly path = '/admin/';

  readonly patientTable: PatientTableComponent;
  readonly patientPagination: PatientPaginationComponent;
  readonly patientSearch: PatientSearchComponent;
  readonly patientForm: PatientFormComponent;

  constructor(private readonly page: Page) {
    this.patientTable = new PatientTableComponent(page);
    this.patientPagination = new PatientPaginationComponent(page);
    this.patientForm = new PatientFormComponent(page);
    this.patientSearch = new PatientSearchComponent(page, this.patientsPanel);
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
    return this.patientsPanel.getByTestId('add-patient');
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
    await this.waitForClinicFormLoaded();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL(/login\.html/, { timeout: 15_000 });
  }

  async showClinicTab(): Promise<void> {
    await this.clinicTab.click();
  }

  async showPatientsTab(): Promise<void> {
    await expect(async () => {
      const selected = await this.patientsTab.getAttribute('aria-selected');
      if (selected !== 'true') {
        await this.patientsTab.click();
      }
      await expect(this.patientsPanel).toBeVisible();
    }).toPass({ timeout: 15_000 });
  }

  async waitForClinicFormLoaded(): Promise<void> {
    await expect(this.clinicNameInput).not.toBeEmpty({ timeout: 10_000 });
  }

  async waitForReady(): Promise<void> {
    await expect(this.userGreeting).not.toBeEmpty({ timeout: 15_000 });
    await this.waitForClinicFormLoaded();
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
    await expect(this.addPatientButton).toBeVisible();
    await this.addPatientButton.click();
  }

  async addPatient(data: PatientFormData): Promise<void> {
    await this.openAddPatientModal();
    await this.patientForm.fillAndSubmit(data);
  }

  async closePatientModal(): Promise<void> {
    await this.closePatientOverlayButton.click();
  }

  async editPatient(name: string, data: Partial<PatientFormData>): Promise<void> {
    await this.showPatientsTab();
    await this.patientSearch.searchByName(name);
    await this.patientTable.clickEditForPatient(name);
    await expect(this.patientFormOverlay).toBeVisible();

    if (data.firstName !== undefined) {
      await this.patientForm.firstNameInput.fill(data.firstName);
    }
    if (data.lastName !== undefined) {
      await this.patientForm.lastNameInput.fill(data.lastName);
    }
    if (data.dateOfBirth !== undefined) {
      await this.patientForm.dateOfBirthInput.fill(data.dateOfBirth);
    }
    if (data.email !== undefined) {
      await this.patientForm.emailInput.fill(data.email);
    }
    if (data.phone !== undefined) {
      await this.patientForm.phoneInput.fill(data.phone);
    }
    if (data.address !== undefined) {
      await this.patientForm.addressInput.fill(data.address);
    }

    await this.patientForm.submit();
  }

  async deletePatient(name: string): Promise<void> {
    await this.showPatientsTab();
    await this.patientSearch.searchByName(name);
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.patientTable.clickDeleteForPatient(name);
    await expect(this.alert).toContainText(/deleted/i, { timeout: 10_000 });
  }
}
