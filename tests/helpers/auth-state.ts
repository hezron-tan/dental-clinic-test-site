import fs from 'node:fs';
import path from 'node:path';

const authDir = path.join(process.cwd(), 'playwright', '.auth');

export const staffAuthState = path.join(authDir, 'staff.json');
export const adminAuthState = path.join(authDir, 'admin.json');

/**
 * Creates `playwright/.auth` if it does not already exist.
 * Call before writing Playwright storage-state JSON (staff/admin).
 */
export function ensureAuthDir(): void {
  fs.mkdirSync(authDir, { recursive: true });
}

/**
 * Returns whether a saved Playwright storage-state file exists on disk.
 * @param filePath - Absolute path to a storage-state JSON file (e.g. `staffAuthState`).
 */
export function authStateExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
