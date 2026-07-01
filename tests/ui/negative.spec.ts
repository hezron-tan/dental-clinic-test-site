import { emptyStorageState, expect, test, unauthenticatedTest } from '../fixtures';
import { AdminDashboardPage, StaffDashboardPage } from '../pages';
import { hasAdminCredentials, hasStaffCredentials } from '../helpers/supabase';
import { adminAuthState, staffAuthState } from '../helpers/auth-state';
import { buildPatient, buildVisitHistory, patientRowMatch, patientSearchQuery, portlandPhone } from '../helpers/test-data';

const adminCredentialsMessage =
  'Set ADMIN_PASSWORD in .env to match your Supabase admin user (see .env.example).';
const staffCredentialsMessage =
  'Set STAFF_PASSWORD in .env to match your Supabase staff user (see .env.example).';

async function expectErrorToast(staffPage: StaffDashboardPage, message: RegExp): Promise<void> {
  await expect(staffPage.errorToast).toBeVisible();
  await expect(staffPage.errorToast).toHaveClass(/toast-error/);
  await expect(staffPage.errorToast).toContainText(message);
}

unauthenticatedTest.describe('Login — negative scenarios', () => {
  unauthenticatedTest.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  unauthenticatedTest('shows a specific error message for invalid credentials', async ({ loginPage, page }) => {
    await loginPage.login({ email: 'wrong@clinic.test', password: 'wrong-password' });

    await expect(loginPage.alert).toBeVisible();
    await expect(loginPage.alert).toHaveClass(/alert-error/);
    await expect(loginPage.alert).toHaveText('Invalid login credentials');
    await expect(page).toHaveURL(/login\.html/);
  });

  unauthenticatedTest('blocks submit when email and password are empty', async ({ loginPage, page }) => {
    await loginPage.submitButton.click();

    await expect(loginPage.emailInput).toHaveJSProperty('validity.valid', false);
    await expect(loginPage.alert).toBeHidden();
    await expect(page).toHaveURL(/login\.html/);
  });

  unauthenticatedTest('blocks submit when email format is invalid', async ({ loginPage, page }) => {
    await loginPage.emailInput.fill('not-an-email');
    await loginPage.passwordInput.fill('some-password');
    await loginPage.submitButton.click();

    await expect(loginPage.emailInput).toHaveJSProperty('validity.valid', false);
    await expect(loginPage.alert).toBeHidden();
    await expect(page).toHaveURL(/login\.html/);
  });
});

test.describe('Route protection — negative scenarios', () => {
  test.use({ storageState: emptyStorageState });

  test('redirects unauthenticated users from admin dashboard to login', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page).toHaveURL(/login\.html/);
  });

  test('redirects unauthenticated users from staff dashboard to login', async ({ page }) => {
    await page.goto('/staff/');
    await expect(page).toHaveURL(/login\.html/);
  });

  test.describe('authenticated staff', () => {
    test.use({ storageState: staffAuthState });

    test('prevents staff users from staying on the admin dashboard', async ({ page }) => {
      test.skip(!hasStaffCredentials(), staffCredentialsMessage);

      await page.goto('/staff/');
      await page.goto('/admin/');

      await expect(page).toHaveURL(/staff\/?/);
    });
  });
});

test.describe('Admin dashboard — negative scenarios', () => {
  test.use({ storageState: adminAuthState });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasAdminCredentials(), adminCredentialsMessage);

    const adminPage = new AdminDashboardPage(page);
    await adminPage.open();
    await adminPage.waitForReady();
  });

  test('blocks saving clinic info when clinic name is cleared', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.clinicNameInput.fill('');
    await adminPage.saveClinicButton.click();

    await expect(adminPage.clinicNameInput).toHaveJSProperty('validity.valid', false);
    await expect(adminPage.alert).toBeHidden();
  });

  test('blocks saving clinic info when email format is invalid', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.clinicEmailInput.fill('not-an-email');
    await adminPage.saveClinicButton.click();

    await expect(adminPage.clinicEmailInput).toHaveJSProperty('validity.valid', false);
    await expect(adminPage.alert).toBeHidden();
  });

  test('blocks saving a patient when required name fields are empty', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.openAddPatientModal();
    await adminPage.patientForm.submit();

    await expect(adminPage.patientForm.firstNameInput).toHaveJSProperty('validity.valid', false);
    await expect(adminPage.alert).toBeHidden();
    await expect(adminPage.patientFormOverlay).toBeVisible();
  });

  test('blocks saving a patient when email format is invalid', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.openAddPatientModal();
    await adminPage.patientForm.firstNameInput.fill('Test');
    await adminPage.patientForm.lastNameInput.fill('Patient');
    await adminPage.patientForm.emailInput.fill('bad-email');
    await adminPage.patientForm.submit();

    await expect(adminPage.patientForm.emailInput).toHaveJSProperty('validity.valid', false);
    await expect(adminPage.alert).toBeHidden();
  });

  test('shows an empty-state row when search finds no patients', async ({ page }) => {
    const adminPage = new AdminDashboardPage(page);

    await adminPage.showPatientsTab();
    await adminPage.patientSearch.search({ name: 'zzzznonexistent-patient-name' });

    await expect(adminPage.patientTable.table).toContainText(/no patients found/i);
    await expect(adminPage.alert).toBeHidden();
  });

  test('does not delete a patient when the confirmation dialog is dismissed', async ({
    page,
    patientTracker
  }) => {
    const adminPage = new AdminDashboardPage(page);
    const patient = buildPatient();

    await adminPage.addPatient(patient);
    patientTracker.track(patient);
    await adminPage.patientSearch.searchByName(patientSearchQuery(patient));
    await expect(adminPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible();

    page.once('dialog', (dialog) => dialog.dismiss());
    await adminPage.patientTable.clickDeleteForPatient(patientRowMatch(patient));

    await adminPage.patientSearch.searchByName(patientSearchQuery(patient));
    await expect(adminPage.patientSearch.rowByName(patientRowMatch(patient))).toBeVisible();
  });
});

test.describe('Staff dashboard — negative scenarios', () => {
  test.use({ storageState: staffAuthState });

  test.beforeEach(async ({ page }) => {
    test.skip(!hasStaffCredentials(), staffCredentialsMessage);

    const staffPage = new StaffDashboardPage(page);
    await staffPage.open();
    await staffPage.waitForReady();
  });

  test('shows a validation error for impossible date of birth values', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.patientSearch.search({ dateOfBirth: '31/02/2020' });

    await expect(staffPage.alert).toBeVisible();
    await expect(staffPage.alert).toHaveClass(/alert-error/);
    await expect(staffPage.alert).toHaveText('Enter date of birth as dd/mm/yyyy.');
  });

  test('shows a validation error for non-date search input', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.patientSearch.search({ dateOfBirth: 'not-a-date' });

    await expect(staffPage.alert).toBeVisible();
    await expect(staffPage.alert).toHaveClass(/alert-error/);
    await expect(staffPage.alert).toHaveText('Enter date of birth as dd/mm/yyyy.');
  });

  test('shows a validation error when date of birth uses ISO format instead of dd/mm/yyyy', async ({
    page
  }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.patientSearch.search({ dateOfBirth: '2020-06-15' });

    await expect(staffPage.alert).toBeVisible();
    await expect(staffPage.alert).toHaveClass(/alert-error/);
    await expect(staffPage.alert).toHaveText('Enter date of birth as dd/mm/yyyy.');
  });

  test('blocks adding a patient when required name fields are empty', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.openAddPatientModal();
    await staffPage.submitAddPatientForm();

    await expect(staffPage.addPatientFirstNameInput).toHaveJSProperty('validity.valid', false);
    await expect(staffPage.alert).toBeHidden();
    await expect(staffPage.addPatientOverlay).toBeVisible();
  });

  test('blocks adding a patient when email format is invalid', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.openAddPatientModal();
    await staffPage.addPatientFirstNameInput.fill('Test');
    await staffPage.addPatientLastNameInput.fill('Patient');
    await staffPage.addPatientEmailInput.fill('bad-email');
    await staffPage.submitAddPatientForm();

    await expect(staffPage.addPatientEmailInput).toHaveJSProperty('validity.valid', false);
    await expect(staffPage.alert).toBeHidden();
  });

  test('shows an empty-state row when search finds no patients', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.patientSearch.search({ name: 'zzzznonexistent-patient-name' });

    await expect(staffPage.patientTable.table).toContainText(/no patients found/i);
    await expect(staffPage.alert).toBeHidden();
  });

  test('keeps view overlay open and shows error toast when patient save fails', async ({
    page,
    patientTracker
  }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();

    await staffPage.addPatient(patient);
    patientTracker.track(patient);
    await staffPage.enterEditMode();

    await page.route('**/rest/v1/patients*', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'save failed', code: '500' })
        });
        return;
      }
      route.continue();
    });

    await staffPage.patientForm.phoneInput.fill(portlandPhone());
    await staffPage.patientForm.submit();

    await expectErrorToast(staffPage, /can't be updated/i);
    await expect(staffPage.viewPatientOverlay).toBeVisible();
  });

  test('keeps add visit overlay open and shows error toast when visit save fails', async ({
    page,
    patientTracker
  }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();
    const visit = buildVisitHistory();

    await staffPage.addPatient(patient);
    patientTracker.track(patient);
    await staffPage.closeViewPatientViaCloseButton();
    await staffPage.openAddVisitModal(patientRowMatch(patient));

    await page.route('**/rest/v1/patient_history*', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'save failed', code: '500' })
        });
        return;
      }
      route.continue();
    });

    await staffPage.historyForm.fillAndSubmit(visit);

    await expectErrorToast(staffPage, /visit can't be updated/i);
    await expect(staffPage.addVisitOverlay).toBeVisible();
  });

  test('blocks saving patient details when required name fields are cleared in edit mode', async ({
    page,
    patientTracker
  }) => {
    const staffPage = new StaffDashboardPage(page);
    const patient = buildPatient();

    await staffPage.addPatient(patient);
    patientTracker.track(patient);
    await staffPage.dismissToast();
    await expect(staffPage.toast).toHaveCount(0);
    await staffPage.enterEditMode();
    await staffPage.patientForm.firstNameInput.fill('');
    await staffPage.patientForm.submit();

    await expect(staffPage.patientForm.firstNameInput).toHaveJSProperty('validity.valid', false);
    await expect(staffPage.viewPatientOverlay).toBeVisible();
    await expect(staffPage.toast).toHaveCount(0);
  });
});
