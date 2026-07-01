import { test as base, expect } from '@playwright/test';
import type { ClinicFormData } from '../models';
import { fetchClinicInfo, restoreClinicInfo } from '../helpers/clinic-api';
import { PatientTracker } from '../helpers/patients-api';
import { hasAdminCredentials } from '../helpers/supabase';
import {
  AdminDashboardPage,
  LoginPage,
  PublicPage,
  StaffDashboardPage
} from '../pages';

const emptyStorageState = { cookies: [] as [], origins: [] as [] };

export { emptyStorageState };

type BaseFixtures = {
  publicPage: PublicPage;
  loginPage: LoginPage;
  patientTracker: PatientTracker;
};

export const test = base.extend<BaseFixtures>({
  publicPage: async ({ page }, use) => {
    await use(new PublicPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  patientTracker: async ({ request }, use) => {
    const tracker = new PatientTracker();
    await use(tracker);
    if (hasAdminCredentials()) {
      await tracker.cleanup(request);
    }
  }
});

export const unauthenticatedTest = test.extend({});
unauthenticatedTest.use({ storageState: emptyStorageState });

export const adminTest = test.extend<{
  adminPage: AdminDashboardPage;
  clinicSnapshot: ClinicFormData | undefined;
}>({
  clinicSnapshot: async ({ request }, use) => {
    const snapshot = hasAdminCredentials() ? await fetchClinicInfo(request) : undefined;
    await use(snapshot);
    if (snapshot) {
      await restoreClinicInfo(request, snapshot);
    }
  },

  adminPage: async ({ page, patientTracker }, use) => {
    const adminPage = new AdminDashboardPage(page);
    const originalAddPatient = adminPage.addPatient.bind(adminPage);
    adminPage.addPatient = async (data) => {
      await originalAddPatient(data);
      patientTracker.track(data);
    };
    await use(adminPage);
  }
});

export const staffTest = test.extend<{
  staffPage: StaffDashboardPage;
}>({
  staffPage: async ({ page, patientTracker }, use) => {
    const staffPage = new StaffDashboardPage(page);
    const originalAddPatient = staffPage.addPatient.bind(staffPage);
    staffPage.addPatient = async (data) => {
      await originalAddPatient(data);
      patientTracker.track(data);
    };
    await use(staffPage);
  }
});

export { expect };
