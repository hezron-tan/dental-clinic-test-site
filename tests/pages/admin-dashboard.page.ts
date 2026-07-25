import { expect, type Locator, type Page } from '@playwright/test';
import type { ClinicFormData, DoctorFormData, PatientFormData } from '../models';
import { isSeedDoctorName, searchQueryFromRowLabel } from '../helpers/test-data';
import { BasePage } from './base.page';
import { LoginPage } from './login.page';
import { DoctorFormComponent } from './components/doctor-form.component';
import { DoctorTableComponent } from './components/doctor-table.component';
import { PatientFormComponent } from './components/patient-form.component';
import { PatientPaginationComponent } from './components/patient-pagination.component';
import { PatientSearchComponent } from './components/patient-search.component';
import { PatientTableComponent } from './components/patient-table.component';

/** Page object for the admin dashboard (`/admin/`). */
export class AdminDashboardPage extends BasePage {
  /** Admin dashboard path relative to `baseURL`. */
  readonly path = '/admin/';

  /** Patient list table on the Patients tab. */
  readonly patientTable: PatientTableComponent;
  /** Pagination controls for the patient list. */
  readonly patientPagination: PatientPaginationComponent;
  /** Patient search form scoped to the patients panel. */
  readonly patientSearch: PatientSearchComponent;
  /** Shared add/edit patient form (overlay). */
  readonly patientForm: PatientFormComponent;
  /** Doctor list table on the Doctors tab. */
  readonly doctorTable: DoctorTableComponent;
  /** Shared add/edit doctor form (overlay). */
  readonly doctorForm: DoctorFormComponent;

  /**
   * @param page - Playwright page for this page object.
   */
  constructor(page: Page) {
    super(page);
    this.patientTable = new PatientTableComponent(page);
    this.patientPagination = new PatientPaginationComponent(page);
    this.patientForm = new PatientFormComponent(page);
    this.patientSearch = new PatientSearchComponent(page, this.patientsPanel);
    this.doctorTable = new DoctorTableComponent(page);
    this.doctorForm = new DoctorFormComponent(page);
  }

  /** Logout control in the admin sidebar drawer. */
  get logoutButton(): Locator {
    return this.page.getByTestId('logout-btn');
  }

  /** Greeting that shows the signed-in admin user. */
  get userGreeting(): Locator {
    return this.page.getByTestId('user-greeting');
  }

  /** App bar title for the active sidebar section. */
  get pageSectionTitle(): Locator {
    return this.page.locator('#page-section-title');
  }

  /** Left navigation drawer. */
  get drawer(): Locator {
    return this.page.locator('#admin-drawer');
  }

  /** Admin status/success/error alert. */
  get alert(): Locator {
    return this.page.getByTestId('admin-alert');
  }

  /** Warning shown when browser storage/session is unavailable. */
  get storageWarning(): Locator {
    return this.page.getByTestId('storage-warning');
  }

  /** Sidebar nav list for Clinic / Patients. */
  get tabs(): Locator {
    return this.page.getByTestId('admin-tabs');
  }

  /** Clinic information sidebar control. */
  get clinicTab(): Locator {
    return this.page.getByTestId('tab-clinic');
  }

  /** Patients sidebar control. */
  get patientsTab(): Locator {
    return this.page.getByTestId('tab-patients');
  }

  /** Clinic tab panel. */
  get clinicPanel(): Locator {
    return this.page.getByTestId('tab-panel-clinic');
  }

  /** Patients tab panel. */
  get patientsPanel(): Locator {
    return this.page.getByTestId('tab-panel-patients');
  }

  /** Doctors sidebar control. */
  get doctorsTab(): Locator {
    return this.page.getByTestId('tab-doctors');
  }

  /** Doctors tab panel. */
  get doctorsPanel(): Locator {
    return this.page.getByTestId('tab-panel-doctors');
  }

  /** Clinic profile form. */
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

  /** Saves the clinic profile form. */
  get saveClinicButton(): Locator {
    return this.page.getByTestId('save-clinic');
  }

  /** Opens the add-patient overlay (Patients tab). */
  get addPatientButton(): Locator {
    return this.patientsPanel.getByTestId('add-patient');
  }

  /** Opens the add-doctor overlay (Doctors tab). */
  get addDoctorButton(): Locator {
    return this.doctorsPanel.getByTestId('add-doctor');
  }

  /** Add/edit patient modal overlay. */
  get patientFormOverlay(): Locator {
    return this.page.getByTestId('patient-form-overlay');
  }

  /** Add/edit doctor modal overlay. */
  get doctorFormOverlay(): Locator {
    return this.page.getByTestId('doctor-form-overlay');
  }

  /** Closes the patient form overlay. */
  get closePatientOverlayButton(): Locator {
    return this.page.getByTestId('close-patient-overlay');
  }

  /** Closes the doctor form overlay. */
  get closeDoctorOverlayButton(): Locator {
    return this.page.getByTestId('close-doctor-overlay');
  }

  /** Opens the admin dashboard (expects an authenticated admin session). */
  async open(): Promise<void> {
    await this.goto(this.path);
  }

  /**
   * Logs in as admin via {@link LoginPage}, then waits for the clinic form to load.
   * @param loginPage - Login page object for the same browser context.
   */
  async openViaLogin(loginPage: LoginPage): Promise<void> {
    await loginPage.open();
    await loginPage.loginExpectingDashboard('admin');
    await this.waitForClinicFormLoaded();
  }

  /** Logs out and waits for redirect to `login.html`. */
  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL(/login\.html/, { timeout: 15_000 });
  }

  /** Selects the Clinic sidebar section. */
  async showClinicTab(): Promise<void> {
    await this.clinicTab.click();
    await this.clinicPanel.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Selects the Patients sidebar section (no-op if already selected) and waits for the panel. */
  async showPatientsTab(): Promise<void> {
    const selected = await this.patientsTab.getAttribute('aria-selected');
    if (selected !== 'true') {
      await this.patientsTab.click();
    }
    await this.patientsPanel.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Selects the Doctors sidebar section (no-op if already selected) and waits for the panel. */
  async showDoctorsTab(): Promise<void> {
    const selected = await this.doctorsTab.getAttribute('aria-selected');
    if (selected !== 'true') {
      await this.doctorsTab.click();
    }
    await this.doctorsPanel.waitFor({ state: 'visible', timeout: 15_000 });
    await this.doctorTable.table.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Waits until the clinic name field is visible and populated from the API. */
  async waitForClinicFormLoaded(): Promise<void> {
    await this.clinicNameInput.waitFor({ state: 'visible', timeout: 10_000 });
    await expect(this.clinicNameInput).not.toBeEmpty({ timeout: 10_000 });
  }

  /** Waits until the admin shell and clinic form are ready for interaction. */
  async waitForReady(): Promise<void> {
    await expect(this.userGreeting).not.toBeEmpty({ timeout: 15_000 });
    await this.waitForClinicFormLoaded();
  }

  /**
   * Fills clinic form fields that are present on `data` (partial updates allowed).
   * @param data - Clinic fields to write; omitted keys are left unchanged.
   */
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

  /** Clicks Save on the clinic form. */
  async saveClinicInfo(): Promise<void> {
    await this.saveClinicButton.click();
  }

  /**
   * Waits for the clinic form, applies `data`, and saves.
   * @param data - Clinic fields to update.
   */
  async updateClinicInfo(data: ClinicFormData): Promise<void> {
    await this.waitForClinicFormLoaded();
    await this.fillClinicForm(data);
    await this.saveClinicInfo();
  }

  /** Opens the Patients tab and the add-patient overlay. */
  async openAddPatientModal(): Promise<void> {
    await this.showPatientsTab();
    await this.addPatientButton.click();
    await this.patientFormOverlay.waitFor({ state: 'visible' });
  }

  /**
   * Opens the add-patient modal, fills the form, and submits.
   * @param data - Patient fields to create.
   */
  async addPatient(data: PatientFormData): Promise<void> {
    await this.openAddPatientModal();
    await this.patientForm.fillAndSubmit(data);
  }

  /** Closes the add/edit patient overlay. */
  async closePatientModal(): Promise<void> {
    await this.closePatientOverlayButton.click();
  }

  /**
   * Finds a patient by row label, opens edit, applies partial fields, and saves.
   * @param name - Patient row label (e.g. `"Last, First"`).
   * @param data - Fields to change; omitted keys are left unchanged.
   */
  async editPatient(name: string, data: Partial<PatientFormData>): Promise<void> {
    await this.showPatientsTab();
    await this.patientSearch.searchByName(searchQueryFromRowLabel(name));
    await this.patientTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.patientTable.clickEditForPatient(name);
    await this.patientFormOverlay.waitFor({ state: 'visible' });

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

  /**
   * Finds a patient by row label and confirms the browser delete dialog.
   * @param name - Patient row label (e.g. `"Last, First"`).
   */
  async deletePatient(name: string): Promise<void> {
    await this.showPatientsTab();
    await this.patientSearch.searchByName(searchQueryFromRowLabel(name));
    await this.patientTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.patientTable.clickDeleteForPatient(name);
  }

  /** Opens the Doctors tab and the add-doctor overlay. */
  async openAddDoctorModal(): Promise<void> {
    await this.showDoctorsTab();
    await this.addDoctorButton.click();
    await this.doctorFormOverlay.waitFor({ state: 'visible' });
  }

  /**
   * Opens the add-doctor modal, fills the form (optional photo), and submits.
   * @param data - Doctor fields to create.
   */
  async addDoctor(data: DoctorFormData): Promise<void> {
    await this.openAddDoctorModal();
    await this.doctorForm.fillAndSubmit(data);
  }

  /** Closes the add/edit doctor overlay. */
  async closeDoctorModal(): Promise<void> {
    await this.closeDoctorOverlayButton.click();
  }

  /**
   * Finds a doctor by display name, opens edit, applies partial fields, and saves.
   * @param name - Exact doctor display name shown in the table.
   * @param data - Fields to change; omitted keys are left unchanged.
   */
  async editDoctor(name: string, data: Partial<DoctorFormData>): Promise<void> {
    await this.showDoctorsTab();
    await this.doctorTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.doctorTable.clickEditForDoctor(name);
    await this.doctorFormOverlay.waitFor({ state: 'visible' });

    if (data.name !== undefined) {
      await this.doctorForm.nameInput.fill(data.name);
    }
    if (data.description !== undefined) {
      await this.doctorForm.descriptionInput.fill(data.description);
    }
    if (data.profilePicturePath !== undefined) {
      await this.doctorForm.photoInput.setInputFiles(data.profilePicturePath);
    }

    await this.doctorForm.submit();
  }

  /**
   * Finds a doctor by display name and confirms the browser delete dialog.
   * Refuses to delete seed doctors from `supabase/seed.sql`.
   * @param name - Exact doctor display name shown in the table.
   * @throws When `name` matches a seeded doctor.
   */
  async deleteDoctor(name: string): Promise<void> {
    if (isSeedDoctorName(name)) {
      throw new Error(`Refusing to delete seed doctor "${name}"`);
    }
    await this.showDoctorsTab();
    await this.doctorTable.rowByName(name).first().waitFor({ state: 'visible', timeout: 10_000 });
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.doctorTable.clickDeleteForDoctor(name);
  }
}
