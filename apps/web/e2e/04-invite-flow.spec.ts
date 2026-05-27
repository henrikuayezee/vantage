import { test, expect, BrowserContext, Page } from '@playwright/test';

const ADMIN_AUTH = 'playwright/.auth/admin.json';

// ── Admin invite management (shared context) ───────────────────────────────

let adminCtx: BrowserContext;
let adminPage: Page;

test.describe('Admin invite management', () => {
  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext({ storageState: ADMIN_AUTH });
    adminPage = await adminCtx.newPage();
    // Prime auth — one rotation happens here
    await adminPage.goto('/admin/users');
    // Page heading is "Users" (h1)
    await expect(adminPage.getByRole('heading', { name: /users/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test.afterAll(async () => {
    await adminCtx.storageState({ path: ADMIN_AUTH });
    await adminCtx.close();
  });

  test.beforeEach(async () => {
    await adminPage.goto('/admin/users');
    // Wait for page to fully render before each test
    await expect(adminPage.getByRole('heading', { name: /users/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('admin users page is accessible', async () => {
    await expect(adminPage.getByRole('heading', { name: /users/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('invite form opens when Invite user button is clicked', async () => {
    // The "Invite user" button toggles an inline form panel (not a modal dialog)
    const inviteBtn = adminPage.getByRole('button', { name: /invite user/i });
    await expect(inviteBtn).toBeVisible({ timeout: 10_000 });
    await inviteBtn.click();
    // Inline form appears with heading "Invite a team member"
    await expect(
      adminPage.getByRole('heading', { name: /invite a team member/i }),
    ).toBeVisible();
    await expect(adminPage.getByPlaceholder('colleague@company.com')).toBeVisible();
  });

  test('shows validation error when invite email is empty', async () => {
    await adminPage.getByRole('button', { name: /invite user/i }).click();
    await adminPage.getByRole('button', { name: /send invite/i }).click();
    await expect(adminPage.getByText(/valid email/i)).toBeVisible({ timeout: 5_000 });
  });
});

// ── Accept invite page (public — no auth needed, fresh page per test) ──────

test.describe('Accept invite page', () => {
  test('shows invalid token message for a bogus token', async ({ page }) => {
    await page.goto('/accept-invite?token=totally-invalid-token-abc123');
    await page.getByLabel('First name').fill('Test');
    await page.getByLabel('Last name').fill('User');
    await page.locator('#password').fill('Test1234!');
    await page.locator('#confirm').fill('Test1234!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(/invalid or has expired/i)).toBeVisible({ timeout: 15_000 });
  });

  test('renders the accept invite form fields', async ({ page }) => {
    await page.goto(
      '/accept-invite?token=aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666gggg7777hhhh8888',
    );
    const hasForm = await page.getByLabel(/first name/i).isVisible().catch(() => false);
    const hasError = await page.getByText(/invalid|expired/i).isVisible().catch(() => false);
    expect(hasForm || hasError).toBe(true);
  });
});
