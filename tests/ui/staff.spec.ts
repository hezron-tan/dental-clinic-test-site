import { expect, test } from '@playwright/test';
import type { VisitHistoryFormData } from '../models';
import { hasStaffCredentials } from '../helpers/supabase';
import { LoginPage, StaffDashboardPage } from '../pages';

const credentialsMessage =
  'Set STAFF_PASSWORD in .env to match your Supabase staff user (see .env.example).';

test.describe('Staff dashboard', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasStaffCredentials(), credentialsMessage);

    const loginPage = new LoginPage(page);
    const staffPage = new StaffDashboardPage(page);
    await staffPage.openViaLogin(loginPage);
  });

  // Verifies the patient list loads and staff can view details without delete access.
  test('lists patients in a table and shows details', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await expect(staffPage.patientTable.table).toBeVisible();
    await expect(staffPage.patientPagination.bar).toBeVisible();

    await staffPage.openPatientDetails('Johnson');

    await expect(staffPage.patientDetails).toBeVisible();
    await expect(staffPage.historyForm.historyList).toBeVisible();
    await expect(staffPage.historyForm.form).toBeVisible();
    await expect(page.getByTestId('delete-patient')).toHaveCount(0);
  });

  // Verifies staff can update a patient's phone number from the details panel.
  test('updates patient phone number', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const uniquePhone = `(503) 555-${String(Date.now()).slice(-4)}`;

    await staffPage.openPatientDetails('Mendez');
    await expect(staffPage.patientDetails).toBeVisible();

    await staffPage.patientForm.phoneInput.fill(uniquePhone);
    await staffPage.patientForm.submit();

    await expect(staffPage.alert).toContainText(/updated/i);
    await expect(staffPage.detailPhone).toHaveText(uniquePhone);
  });

  // Verifies staff can add a visit history record for an existing patient.
  test('adds a visit history record', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);
    const visit: VisitHistoryFormData = {
      visitDate: new Date().toISOString().slice(0, 10),
      procedure: 'Cleaning',
      description: 'Playwright automated test visit',
      dentist: 'Dr. Test'
    };

    await staffPage.openPatientDetails('Chen');
    await staffPage.addVisitHistory(visit);

    await expect(staffPage.alert).toContainText(/added/i);
    await expect(staffPage.historyForm.historyEntries.first()).toContainText('Cleaning');
  });

  // Verifies the patient search form filters results by name.
  test('searches patients by name', async ({ page }) => {
    const staffPage = new StaffDashboardPage(page);

    await staffPage.patientSearch.searchByName('Johnson');

    const rows = staffPage.patientTable.rows;
    await expect(rows).not.toHaveCount(0);
    await expect(rows.first()).toContainText('Johnson');
  });
});
