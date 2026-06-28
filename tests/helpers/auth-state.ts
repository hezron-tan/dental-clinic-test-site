import fs from 'node:fs';
import path from 'node:path';

const authDir = path.join(process.cwd(), 'playwright', '.auth');

export const staffAuthState = path.join(authDir, 'staff.json');
export const adminAuthState = path.join(authDir, 'admin.json');

export function ensureAuthDir(): void {
  fs.mkdirSync(authDir, { recursive: true });
}

export function authStateExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
