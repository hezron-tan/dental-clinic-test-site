import { test as setup } from '@playwright/test';
import {
  adminAuthState,
  ensureAuthDir,
  staffAuthState
} from './helpers/auth-state';
import { hasAdminCredentials, hasStaffCredentials } from './helpers/supabase';
import { LoginPage } from './pages';

const staffCredentialsMessage =
  'Set STAFF_PASSWORD in .env to match your Supabase staff user (see .env.example).';
const adminCredentialsMessage =
  'Set ADMIN_PASSWORD in .env to match your Supabase admin user (see .env.example).';

setup('authenticate staff user', async ({ page }) => {
  setup.skip(!hasStaffCredentials(), staffCredentialsMessage);

  ensureAuthDir();
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.loginExpectingDashboard('staff');
  await page.context().storageState({ path: staffAuthState });
});

setup('authenticate admin user', async ({ page }) => {
  setup.skip(!hasAdminCredentials(), adminCredentialsMessage);

  ensureAuthDir();
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.loginExpectingDashboard('admin');
  await page.context().storageState({ path: adminAuthState });
});
