import { test, expect } from '@playwright/test';
import { loginAsAdmin, SEED_USERS } from './fixtures/auth';

const ADMIN_AUTH = 'playwright/.auth/admin.json';
const DEV_AUTH = 'playwright/.auth/developer.json';

// ── Login UI tests (no stored auth) ────────────────────────────────────────

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login form with email and password fields', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  });

  test('shows validation errors for empty submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@acme.com');
    await page.getByLabel('Password').fill('WrongPassword1!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10_000 });
  });

  test('redirects to /dashboard after successful admin login', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Welcome back, Henry/i)).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated user is redirected to /login when accessing dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ── Admin dashboard content (uses stored admin auth) ───────────────────────
// IMPORTANT: afterEach saves the rotated token so subsequent "authenticated"
// project tests start with a valid token.

test.describe('Admin dashboard content', () => {
  test.use({ storageState: ADMIN_AUTH });

  test.afterEach(async ({ page }) => {
    // Refresh token is rotated on each page load. Persist the new token so
    // the next test that loads ADMIN_AUTH gets a valid (non-rotated) token.
    await page.context().storageState({ path: ADMIN_AUTH });
  });

  test('admin dashboard shows admin-specific content', async ({ page }) => {
    await page.goto('/dashboard');
    // The ADMIN subtitle is "Here's an overview of your organization."
    await expect(page.getByText(/overview of your organization/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ── Developer dashboard content (uses stored developer auth) ───────────────

test.describe('Developer dashboard content', () => {
  test.use({ storageState: DEV_AUTH });

  test.afterEach(async ({ page }) => {
    await page.context().storageState({ path: DEV_AUTH });
  });

  test('developer dashboard shows developer-specific content', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Welcome back, Alex/i)).toBeVisible({ timeout: 10_000 });
  });
});
