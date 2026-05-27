import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_DIR = path.join(__dirname, '..', 'playwright', '.auth');
const ADMIN_AUTH_FILE = path.join(AUTH_DIR, 'admin.json');
const DEV_AUTH_FILE = path.join(AUTH_DIR, 'developer.json');

setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@acme.com');
  await page.getByLabel('Password').fill('Admin123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});

setup('authenticate as developer', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await page.goto('/login');
  await page.getByLabel('Email').fill('alex@acme.com');
  await page.getByLabel('Password').fill('Test123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await page.context().storageState({ path: DEV_AUTH_FILE });
});
