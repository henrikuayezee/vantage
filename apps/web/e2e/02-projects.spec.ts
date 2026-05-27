import { test, expect, BrowserContext, Page } from '@playwright/test';

const ADMIN_AUTH = 'playwright/.auth/admin.json';
const DEV_AUTH = 'playwright/.auth/developer.json';

// ── Admin: shared context so refresh-token rotations cascade ───────────────

let adminCtx: BrowserContext;
let adminPage: Page;

test.describe('Projects flow', () => {
  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext({ storageState: ADMIN_AUTH });
    adminPage = await adminCtx.newPage();
    // Prime auth — one rotation happens here; subsequent navigations reuse the updated cookie
    await adminPage.goto('/projects');
    await expect(adminPage.getByRole('heading', { name: 'Projects' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test.afterAll(async () => {
    await adminCtx.storageState({ path: ADMIN_AUTH });
    await adminCtx.close();
  });

  test.beforeEach(async () => {
    await adminPage.goto('/projects');
  });

  test('projects page shows project list and New project button for admin', async () => {
    await expect(adminPage.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: 'New project' })).toBeVisible();
    await expect(adminPage.locator('[data-testid="project-card"]').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('status filter buttons are visible and clickable', async () => {
    const filters = ['All', 'Active', 'Completed', 'Archived'];
    for (const label of filters) {
      await expect(adminPage.getByRole('button', { name: label })).toBeVisible();
    }
    await adminPage.getByRole('button', { name: 'Active' }).click();
    await expect(adminPage.getByRole('button', { name: 'Active' })).toHaveClass(
      /bg-\[var\(--primary\)\]/,
    );
  });

  test('opens Create Project modal when New project button is clicked', async () => {
    await adminPage.getByRole('button', { name: 'New project' }).click();
    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'New project' })).toBeVisible();
    await expect(adminPage.getByPlaceholder('e.g. Website Redesign')).toBeVisible();
  });

  test('shows validation error when creating project without a name', async () => {
    await adminPage.getByRole('button', { name: 'New project' }).click();
    await adminPage.getByRole('button', { name: 'Create project' }).click();
    await expect(adminPage.getByText('Name is required')).toBeVisible();
  });

  test('creates a new project and shows it in the list', async () => {
    const projectName = `E2E Test Project ${Date.now()}`;
    await adminPage.getByRole('button', { name: 'New project' }).click();
    await adminPage.getByPlaceholder('e.g. Website Redesign').fill(projectName);
    await adminPage.getByRole('button', { name: 'Create project' }).click();
    await expect(adminPage.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
    await expect(adminPage.getByText(projectName)).toBeVisible({ timeout: 10_000 });
  });
});

// ── Developer: shared context ───────────────────────────────────────────────

let devCtx: BrowserContext;
let devPage: Page;

test.describe('Projects flow — developer', () => {
  test.beforeAll(async ({ browser }) => {
    devCtx = await browser.newContext({ storageState: DEV_AUTH });
    devPage = await devCtx.newPage();
    await devPage.goto('/projects');
    await expect(devPage.getByRole('heading', { name: 'Projects' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test.afterAll(async () => {
    await devCtx.storageState({ path: DEV_AUTH });
    await devCtx.close();
  });

  test('developer can see projects page but has no New project button', async () => {
    await devPage.goto('/projects');
    await expect(devPage.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(devPage.getByRole('button', { name: 'New project' })).not.toBeVisible();
  });
});
