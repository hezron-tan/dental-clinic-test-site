import { test as base, expect } from '@playwright/test';
import type { ClinicFormData } from '../models';
import { fetchClinicInfo, restoreClinicInfo } from '../helpers/clinic-api';
import { DoctorTracker } from '../helpers/doctors-api';
import { PatientTracker } from '../helpers/patients-api';
import { hasAdminCredentials } from '../helpers/supabase';
import {
  AdminDashboardPage,
  LoginPage,
  PublicPage,
  StaffDashboardPage
} from '../pages';

/**
 * Empty Playwright storage state (no cookies/origins).
 * Used to force a logged-out browser context.
 */
const emptyStorageState = { cookies: [] as [], origins: [] as [] };

export { emptyStorageState };

/**
 * Shared fixtures available on the base {@link test} and all role-specific variants.
 */
type BaseFixtures = {
  /** Page object for the public marketing site. */
  publicPage: PublicPage;
  /** Page object for the staff/admin login screen. */
  loginPage: LoginPage;
  /**
   * Collects patients created during a test and deletes them via API in teardown
   * when admin credentials are available.
   */
  patientTracker: PatientTracker;
  /**
   * Collects doctors created during a test and deletes them via API in teardown
   * when admin credentials are available. Never tracks seed doctors.
   */
  doctorTracker: DoctorTracker;
};

/**
 * Base Playwright test with shared page objects and patient/doctor cleanup.
 * Specs that need a specific auth role should prefer {@link adminTest},
 * {@link staffTest}, or {@link unauthenticatedTest}.
 */
export const test = base.extend<BaseFixtures>({
  /** Provides a {@link PublicPage} bound to the current browser page. */
  publicPage: async ({ page }, use) => {
    await use(new PublicPage(page));
  },

  /** Provides a {@link LoginPage} bound to the current browser page. */
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  /**
   * Tracks patients created in the test; after the test, deletes them via API
   * when `ADMIN_PASSWORD` is configured.
   */
  patientTracker: async ({ request }, use) => {
    const tracker = new PatientTracker();
    await use(tracker);
    if (hasAdminCredentials()) {
      await tracker.cleanup(request);
    }
  },

  /**
   * Tracks doctors created in the test; after the test, deletes them via API
   * when `ADMIN_PASSWORD` is configured. Seed doctors are never deleted.
   */
  doctorTracker: async ({ request }, use) => {
    const tracker = new DoctorTracker();
    await use(tracker);
    if (hasAdminCredentials()) {
      await tracker.cleanup(request);
    }
  }
});

/**
 * Base test forced to run logged out (empty storage state).
 * Use for login and other unauthenticated flows.
 */
export const unauthenticatedTest = test.extend({});
unauthenticatedTest.use({ storageState: emptyStorageState });

/**
 * Admin-role tests: admin dashboard page object plus clinic profile snapshot/restore.
 * Pair with `adminTest.use({ storageState: adminAuthState })` in the spec.
 */
export const adminTest = test.extend<{
  /** Page object for the admin dashboard (auto-tracks patients added via UI). */
  adminPage: AdminDashboardPage;
  /**
   * Clinic profile captured before the test; restored afterward so admin edits
   * do not leak into later tests. `undefined` when admin credentials are missing.
   */
  clinicSnapshot: ClinicFormData | undefined;
}>({
  /**
   * Snapshots `clinic_info` before the test and restores it in teardown.
   * Only runs when a test (or another fixture) depends on `clinicSnapshot`.
   */
  clinicSnapshot: async ({ request }, use) => {
    const snapshot = hasAdminCredentials() ? await fetchClinicInfo(request) : undefined;
    await use(snapshot);
    if (snapshot) {
      await restoreClinicInfo(request, snapshot);
    }
  },

  /**
   * Admin dashboard page object whose `addPatient` / `addDoctor` also register
   * rows with the matching trackers for API cleanup.
   */
  adminPage: async ({ page, patientTracker, doctorTracker }, use) => {
    const adminPage = new AdminDashboardPage(page);
    const originalAddPatient = adminPage.addPatient.bind(adminPage);
    adminPage.addPatient = async (data) => {
      await originalAddPatient(data);
      patientTracker.track(data);
    };
    const originalAddDoctor = adminPage.addDoctor.bind(adminPage);
    adminPage.addDoctor = async (data) => {
      await originalAddDoctor(data);
      doctorTracker.track(data);
    };
    await use(adminPage);
  }
});

/**
 * Staff-role tests: staff dashboard page object with auto patient tracking.
 * Pair with `staffTest.use({ storageState: staffAuthState })` in the spec.
 */
export const staffTest = test.extend<{
  /** Page object for the staff dashboard (auto-tracks patients added via UI). */
  staffPage: StaffDashboardPage;
}>({
  /**
   * Staff dashboard page object whose `addPatient` also registers the patient
   * with {@link BaseFixtures.patientTracker} for API cleanup.
   */
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

/** Re-export Playwright `expect` so specs can import fixtures and assertions together. */
export { expect };
