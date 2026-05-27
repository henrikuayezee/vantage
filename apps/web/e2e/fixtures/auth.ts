import { Page } from '@playwright/test';

export const SEED_USERS = {
  admin: { email: 'henry@acme.com', password: 'Admin123!', name: 'Henry' },
  pm: { email: 'sarah@acme.com', password: 'Test123!', name: 'Sarah' },
  developer: { email: 'alex@acme.com', password: 'Test123!', name: 'Alex' },
} as const;

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

export async function loginAsAdmin(page: Page) {
  return login(page, SEED_USERS.admin.email, SEED_USERS.admin.password);
}

export async function loginAsPm(page: Page) {
  return login(page, SEED_USERS.pm.email, SEED_USERS.pm.password);
}

export async function loginAsDeveloper(page: Page) {
  return login(page, SEED_USERS.developer.email, SEED_USERS.developer.password);
}
