import { expect, type Locator, type Page } from '@playwright/test';
import type { PatientFormData, VisitHistoryFormData } from '../models';
import { searchQueryFromRowLabel } from '../helpers/test-data';
import { BasePage } from './base.page';
import { LoginPage } from './login.page';
import { HistoryFormComponent } from './components/history-form.component';
import { PatientFormComponent } from './components/patient-form.component';
import { PatientPaginationComponent } from './components/patient-pagination.component';
import { PatientSearchComponent } from './components/patient-search.component';
import { PatientTableComponent } from './components/patient-table.component';

export class StaffDashboardPage extends BasePage {
  readonly path = '/staff/';

  readonly patientTable: PatientTableComponent;
  readonly patientPagination: PatientPaginationComponent;
  readonly patientSearch: PatientSearchComponent;
  readonly patientForm: PatientFormComponent;
  readonly historyForm: HistoryFormComponent;

  constructor(page: Page) {
    super(page);
    this.patientTable = new PatientTableComponent(page);
    this.patientPagination = new PatientPaginationComponent(page);
    this.patientSearch = new PatientSearchComponent(page);
    this.patientForm = new PatientFormComponent(page, page.getByTestId('view-patient-overlay'));
    this.historyForm = new HistoryFormComponent(
      page,
      page.getByTestId('add-visit-overlay'),
      page.getByTestId('view-patient-overlay')
    );
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

  get toastContainer(): Locator {
    return this.page.getByTestId('toast-container');
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get addPatientButton(): Locator {
    return this.page.getByTestId('add-patient');
  }

  get viewPatientOverlay(): Locator {
    return this.page.getByTestId('view-patient-overlay');
  }

  get patientReadonlyView(): Locator {
    return this.page.getByTestId('patient-readonly-view');
  }

  get patientEditView(): Locator {
    return this.page.getByTestId('patient-edit-view');
  }

  get editPatientButton(): Locator {
    return this.page.getByTestId('edit-patient-btn');
  }

  get viewPhone(): Locator {
    return this.page.getByTestId('view-phone');
  }

  get cancelViewPatientButton(): Locator {
    return this.page.getByTestId('cancel-view-patient-btn');
  }

  get closeViewPatientButton(): Locator {
    return this.page.getByTestId('close-view-patient-overlay');
  }

  get addVisitOverlay(): Locator {
    return this.page.getByTestId('add-visit-overlay');
  }

  get cancelAddVisitButton(): Locator {
    return this.page.getByTestId('cancel-add-visit-btn');
  }

  get closeAddVisitButton(): Locator {
    return this.page.getByTestId('close-add-visit-overlay');
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

  get deletePatientButtons(): Locator {
    return this.page.getByTestId('delete-patient');
  }

  get firstRowViewButton(): Locator {
    return this.patientTable.rows.first().getByTestId('view-patient');
  }

  get firstRowAddVisitButton(): Locator {
    return this.patientTable.rows.first().getByTestId('add-visit-patient');
  }

  async open(): Promise<void> {
    await this.goto(this.path);
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
    if (await this.addPatientOverlay.isHidden()) {
      await this.addPatientButton.click();
    }
    await this.addPatientOverlay.waitFor({ state: 'visible', timeout: 15_000 });
    await this.addPatientFirstNameInput.waitFor({ state: 'visible', timeout: 15_000 });
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

  async openViewPatient(name: string): Promise<void> {
    await this.patientSearch.searchByName(searchQueryFromRowLabel(name));
    await this.patientTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.patientTable.clickViewForPatient(name);
    await this.viewPatientOverlay.waitFor({ state: 'visible' });
  }

  async closeViewPatientViaCancel(): Promise<void> {
    await this.cancelViewPatientButton.click();
  }

  async closeViewPatientViaCloseButton(): Promise<void> {
    await this.closeViewPatientButton.click();
  }

  async enterEditMode(): Promise<void> {
    await this.editPatientButton.click();
    await this.patientEditView.waitFor({ state: 'visible' });
  }

  async updatePatient(data: PatientFormData): Promise<void> {
    await this.patientForm.fillAndSubmit(data);
  }

  async openAddVisitModal(name: string): Promise<void> {
    await this.patientSearch.searchByName(searchQueryFromRowLabel(name));
    await this.patientTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.patientTable.clickAddVisitForPatient(name);
    await this.addVisitOverlay.waitFor({ state: 'visible' });
  }

  async closeAddVisitViaCancel(): Promise<void> {
    await this.cancelAddVisitButton.click();
  }

  async closeAddVisitViaCloseButton(): Promise<void> {
    await this.closeAddVisitButton.click();
  }

  async addVisitHistory(data: VisitHistoryFormData, patientName?: string): Promise<void> {
    if (patientName) {
      await this.openAddVisitModal(patientName);
    }
    await this.historyForm.fillAndSubmit(data);
  }

  get successToast(): Locator {
    return this.toast.last();
  }

  get errorToast(): Locator {
    return this.toast.last();
  }

  async dismissToast(): Promise<void> {
    await this.toast.last().locator('.toast-close').click();
  }
}
