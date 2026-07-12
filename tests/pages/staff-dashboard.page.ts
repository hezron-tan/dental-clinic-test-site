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

/** Page object for the staff dashboard (`/staff/`). */
export class StaffDashboardPage extends BasePage {
  /** Staff dashboard path relative to `baseURL`. */
  readonly path = '/staff/';

  /** Patient list table. */
  readonly patientTable: PatientTableComponent;
  /** Pagination controls for the patient list. */
  readonly patientPagination: PatientPaginationComponent;
  /** Patient search form. */
  readonly patientSearch: PatientSearchComponent;
  /** Edit-patient form scoped to the view overlay. */
  readonly patientForm: PatientFormComponent;
  /** Visit history form (add-visit overlay) and list (view overlay). */
  readonly historyForm: HistoryFormComponent;

  /**
   * @param page - Playwright page for this page object.
   */
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

  /** Logout control in the staff chrome. */
  get logoutButton(): Locator {
    return this.page.getByTestId('logout-btn');
  }

  /** Greeting that shows the signed-in staff user. */
  get userGreeting(): Locator {
    return this.page.getByTestId('user-greeting');
  }

  /** Staff status alert (legacy; prefer toasts for success/error). */
  get alert(): Locator {
    return this.page.getByTestId('staff-alert');
  }

  /** Container for toast notifications. */
  get toastContainer(): Locator {
    return this.page.getByTestId('toast-container');
  }

  /** All toast notification elements. */
  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  /** Opens the add-patient overlay. */
  get addPatientButton(): Locator {
    return this.page.getByTestId('add-patient');
  }

  /** View/edit patient overlay. */
  get viewPatientOverlay(): Locator {
    return this.page.getByTestId('view-patient-overlay');
  }

  /** Read-only patient details inside the view overlay. */
  get patientReadonlyView(): Locator {
    return this.page.getByTestId('patient-readonly-view');
  }

  /** Editable patient form inside the view overlay. */
  get patientEditView(): Locator {
    return this.page.getByTestId('patient-edit-view');
  }

  /** Switches the view overlay from read-only to edit mode. */
  get editPatientButton(): Locator {
    return this.page.getByTestId('edit-patient-btn');
  }

  /** Phone value shown in the read-only patient view. */
  get viewPhone(): Locator {
    return this.page.getByTestId('view-phone');
  }

  /** Cancel control that closes the view patient overlay. */
  get cancelViewPatientButton(): Locator {
    return this.page.getByTestId('cancel-view-patient-btn');
  }

  /** Close (X) control for the view patient overlay. */
  get closeViewPatientButton(): Locator {
    return this.page.getByTestId('close-view-patient-overlay');
  }

  /** Add visit history overlay. */
  get addVisitOverlay(): Locator {
    return this.page.getByTestId('add-visit-overlay');
  }

  /** Cancel control that closes the add-visit overlay. */
  get cancelAddVisitButton(): Locator {
    return this.page.getByTestId('cancel-add-visit-btn');
  }

  /** Close (X) control for the add-visit overlay. */
  get closeAddVisitButton(): Locator {
    return this.page.getByTestId('close-add-visit-overlay');
  }

  /** Add-patient overlay. */
  get addPatientOverlay(): Locator {
    return this.page.getByTestId('add-patient-overlay');
  }

  /** Form inside the add-patient overlay. */
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

  /** Submits the add-patient form. */
  get saveNewPatientButton(): Locator {
    return this.addPatientOverlay.getByTestId('save-new-patient');
  }

  /** Closes the add-patient overlay. */
  get closeAddPatientOverlayButton(): Locator {
    return this.page.getByTestId('close-add-patient-overlay');
  }

  /** Delete actions in the patient table (staff UI typically has none). */
  get deletePatientButtons(): Locator {
    return this.page.getByTestId('delete-patient');
  }

  /** View action on the first patient table row. */
  get firstRowViewButton(): Locator {
    return this.patientTable.rows.first().getByTestId('view-patient');
  }

  /** Add Visit action on the first patient table row. */
  get firstRowAddVisitButton(): Locator {
    return this.patientTable.rows.first().getByTestId('add-visit-patient');
  }

  /** Opens the staff dashboard (expects an authenticated staff session). */
  async open(): Promise<void> {
    await this.goto(this.path);
  }

  /**
   * Logs in as staff via {@link LoginPage}, then waits until the dashboard is ready.
   * @param loginPage - Login page object for the same browser context.
   */
  async openViaLogin(loginPage: LoginPage): Promise<void> {
    await loginPage.open();
    await loginPage.loginExpectingDashboard('staff');
    await this.waitForReady();
  }

  /** Waits until greeting, pagination, and add-patient are ready for interaction. */
  async waitForReady(): Promise<void> {
    await expect(this.userGreeting).not.toBeEmpty({ timeout: 15_000 });
    await expect(this.patientPagination.pageInfo).toContainText(/showing|page/i, {
      timeout: 15_000
    });
    await expect(this.addPatientButton).toBeEnabled();
  }

  /** Logs out and waits for redirect to `login.html`. */
  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL(/login\.html/, { timeout: 15_000 });
  }

  /** Opens the add-patient overlay if hidden and waits for the form. */
  async openAddPatientModal(): Promise<void> {
    if (await this.addPatientOverlay.isHidden()) {
      await this.addPatientButton.click();
    }
    await this.addPatientOverlay.waitFor({ state: 'visible', timeout: 15_000 });
    await this.addPatientFirstNameInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Fills the add-patient overlay fields.
   * @param data - Patient fields to enter; optional fields are skipped when omitted.
   */
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

  /** Submits the add-patient overlay form. */
  async submitAddPatientForm(): Promise<void> {
    await this.saveNewPatientButton.click();
  }

  /**
   * Opens the add-patient modal, fills the form, and submits.
   * @param data - Patient fields to create.
   */
  async addPatient(data: PatientFormData): Promise<void> {
    await this.openAddPatientModal();
    await this.fillAddPatientForm(data);
    await this.submitAddPatientForm();
  }

  /** Closes the add-patient overlay. */
  async closeAddPatientModal(): Promise<void> {
    await this.closeAddPatientOverlayButton.click();
  }

  /**
   * Searches for a patient by row label and opens the view overlay.
   * @param name - Patient row label (e.g. `"Last, First"`).
   */
  async openViewPatient(name: string): Promise<void> {
    await this.patientSearch.searchByName(searchQueryFromRowLabel(name));
    await this.patientTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.patientTable.clickViewForPatient(name);
    await this.viewPatientOverlay.waitFor({ state: 'visible' });
  }

  /** Closes the view patient overlay via Cancel. */
  async closeViewPatientViaCancel(): Promise<void> {
    await this.cancelViewPatientButton.click();
  }

  /** Closes the view patient overlay via the close (X) button. */
  async closeViewPatientViaCloseButton(): Promise<void> {
    await this.closeViewPatientButton.click();
  }

  /** Switches the open view overlay into edit mode. */
  async enterEditMode(): Promise<void> {
    await this.editPatientButton.click();
    await this.patientEditView.waitFor({ state: 'visible' });
  }

  /**
   * Fills and submits the edit-patient form in the view overlay.
   * @param data - Patient fields to save.
   */
  async updatePatient(data: PatientFormData): Promise<void> {
    await this.patientForm.fillAndSubmit(data);
  }

  /**
   * Searches for a patient by row label and opens the add-visit overlay.
   * @param name - Patient row label (e.g. `"Last, First"`).
   */
  async openAddVisitModal(name: string): Promise<void> {
    await this.patientSearch.searchByName(searchQueryFromRowLabel(name));
    await this.patientTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.patientTable.clickAddVisitForPatient(name);
    await this.addVisitOverlay.waitFor({ state: 'visible' });
  }

  /** Closes the add-visit overlay via Cancel. */
  async closeAddVisitViaCancel(): Promise<void> {
    await this.cancelAddVisitButton.click();
  }

  /** Closes the add-visit overlay via the close (X) button. */
  async closeAddVisitViaCloseButton(): Promise<void> {
    await this.closeAddVisitButton.click();
  }

  /**
   * Optionally opens add-visit for a patient, then fills and submits visit history.
   * @param data - Visit history fields to create.
   * @param patientName - When set, opens the add-visit modal for that row label first.
   */
  async addVisitHistory(data: VisitHistoryFormData, patientName?: string): Promise<void> {
    if (patientName) {
      await this.openAddVisitModal(patientName);
    }
    await this.historyForm.fillAndSubmit(data);
  }

  /** Most recent toast (used for success assertions). */
  get successToast(): Locator {
    return this.toast.last();
  }

  /** Most recent toast (used for error assertions). */
  get errorToast(): Locator {
    return this.toast.last();
  }

  /** Dismisses the most recent toast via its close control. */
  async dismissToast(): Promise<void> {
    await this.toast.last().locator('.toast-close').click();
  }
}
