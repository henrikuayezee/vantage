import { test, expect, BrowserContext, Page } from '@playwright/test';

const ADMIN_AUTH = 'playwright/.auth/admin.json';

let adminCtx: BrowserContext;
let adminPage: Page;
let projectUrl: string;

async function switchToBoard(page: Page) {
  await page.getByRole('tab', { name: /board/i }).click();
  await expect(page.getByText('Backlog')).toBeVisible({ timeout: 10_000 });
}

async function switchToTasks(page: Page) {
  await page.getByRole('tab', { name: /tasks/i }).click();
  // Wait for the tab to be active (toolbar New task button appears)
  await expect(page.getByRole('tab', { name: /tasks/i })).toBeVisible({ timeout: 5_000 });
}

test.describe('Tasks and Kanban', () => {
  test.beforeAll(async ({ browser }) => {
    adminCtx = await browser.newContext({ storageState: ADMIN_AUTH });
    adminPage = await adminCtx.newPage();
    // One full page load to get auth token, then SPA-navigate to a project
    await adminPage.goto('/projects');
    const firstCard = adminPage.locator('[data-testid="project-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();
    await adminPage.waitForURL(/\/projects\/.+/);
    projectUrl = adminPage.url();
  });

  test.afterAll(async () => {
    await adminCtx.storageState({ path: ADMIN_AUTH });
    await adminCtx.close();
  });

  test.beforeEach(async () => {
    // Avoid full page reloads between tests — they clear the in-memory access token
    // and each reload triggers a refresh rotation that can exhaust the token chain.
    const currentPath = new URL(adminPage.url()).pathname;
    if (!currentPath.startsWith('/projects/')) {
      // We navigated away — do a full reload as a fallback
      await adminPage.goto(projectUrl);
      await expect(adminPage.getByRole('tab', { name: /tasks/i })).toBeVisible({
        timeout: 15_000,
      });
      return;
    }
    // Already on the project page — just clean up UI state
    if (await adminPage.getByRole('dialog').isVisible().catch(() => false)) {
      await adminPage.keyboard.press('Escape');
      await adminPage.getByRole('dialog').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }
    if (await adminPage.locator('[data-testid="task-drawer"]').isVisible().catch(() => false)) {
      await adminPage.keyboard.press('Escape');
      await adminPage
        .locator('[data-testid="task-drawer"]')
        .waitFor({ state: 'hidden', timeout: 5_000 })
        .catch(() => {});
    }
    // Go back to Tasks tab
    await switchToTasks(adminPage).catch(() => {});
  });

  test('project detail page shows kanban board with columns', async () => {
    await switchToBoard(adminPage);
    await expect(adminPage.getByText('To Do')).toBeVisible();
    await expect(adminPage.getByText('In Progress')).toBeVisible();
    await expect(adminPage.getByText('Done')).toBeVisible();
  });

  test('can switch between Board and Tasks tabs', async () => {
    await expect(adminPage.getByRole('tab', { name: /tasks/i })).toBeVisible({ timeout: 10_000 });
    await expect(adminPage.getByRole('tab', { name: /board/i })).toBeVisible();
    await expect(adminPage.getByRole('tab', { name: /gantt/i })).toBeVisible();
    // Switch to Board and verify kanban appears
    await adminPage.getByRole('tab', { name: /board/i }).click();
    await expect(adminPage.getByText('Backlog')).toBeVisible({ timeout: 10_000 });
    // Switch back to Tasks and verify list view appears
    await adminPage.getByRole('tab', { name: /tasks/i }).click();
    // Two "New task" buttons appear when list is empty (toolbar + empty-state); use first()
    await expect(adminPage.getByRole('button', { name: 'New task' }).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('opens Create Task modal from the New task button', async () => {
    const addButton = adminPage.getByRole('button', { name: 'New task' }).first();
    await expect(addButton).toBeVisible({ timeout: 10_000 });
    await addButton.click();
    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'New task' })).toBeVisible();
  });

  test('shows validation error when creating task without title', async () => {
    await adminPage.getByRole('button', { name: 'New task' }).first().click();
    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await adminPage.getByRole('button', { name: 'Create task' }).click();
    await expect(adminPage.getByText('Title is required')).toBeVisible();
  });

  test('creates a task and it appears in the correct kanban column', async () => {
    const taskTitle = `E2E Task ${Date.now()}`;
    await adminPage.getByRole('button', { name: 'New task' }).first().click();
    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await adminPage.getByPlaceholder('Task name…').fill(taskTitle);
    await adminPage.getByRole('button', { name: 'Create task' }).click();
    await expect(adminPage.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
    await expect(adminPage.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });
  });

  test('opens task drawer when clicking a task card', async () => {
    // Create a task while on Tasks tab so we know a card will exist on the board
    const taskTitle = `Drawer Test ${Date.now()}`;
    const addButton = adminPage.getByRole('button', { name: 'New task' }).first();
    await expect(addButton).toBeVisible({ timeout: 10_000 });
    await addButton.click();
    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await adminPage.getByPlaceholder('Task name…').fill(taskTitle);
    await adminPage.getByRole('button', { name: 'Create task' }).click();
    await expect(adminPage.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
    await expect(adminPage.getByText(taskTitle)).toBeVisible({ timeout: 10_000 });

    await switchToBoard(adminPage);
    // Wait for any board-specific API fetches to complete before looking for cards
    await adminPage.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
    const taskCard = adminPage.locator('[data-testid="kanban-card"]').first();
    await expect(taskCard).toBeVisible({ timeout: 15_000 });
    await taskCard.click();
    await expect(adminPage.locator('[data-testid="task-drawer"]')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Kanban drag and drop', () => {
  let dndCtx: BrowserContext;
  let dndPage: Page;
  let dndProjectUrl: string;

  test.beforeAll(async ({ browser }) => {
    dndCtx = await browser.newContext({ storageState: ADMIN_AUTH });
    dndPage = await dndCtx.newPage();
    // One full page load to get auth token, then SPA-navigate to project Board view
    await dndPage.goto('/projects');
    const firstCard = dndPage.locator('[data-testid="project-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();
    await dndPage.waitForURL(/\/projects\/.+/);
    dndProjectUrl = dndPage.url();
    // Pre-navigate to Board view
    await dndPage.getByRole('tab', { name: /board/i }).click();
    await expect(dndPage.getByText('Backlog')).toBeVisible({ timeout: 10_000 });
  });

  test.afterAll(async () => {
    await dndCtx.storageState({ path: ADMIN_AUTH });
    await dndCtx.close();
  });

  test.beforeEach(async () => {
    // Lightweight check — only reload if we navigated away from the project
    const currentPath = new URL(dndPage.url()).pathname;
    if (!currentPath.startsWith('/projects/')) {
      await dndPage.goto(dndProjectUrl);
      await dndPage.getByRole('tab', { name: /board/i }).click();
      await expect(dndPage.getByText('Backlog')).toBeVisible({ timeout: 10_000 });
    }
  });

  test('dragging a task card between columns changes its status', async () => {
    // Find a card that is NOT already in DONE so the drag actually moves it
    const notDoneCard = dndPage
      .locator(
        '[data-testid="kanban-column-BACKLOG"] [data-testid="kanban-card"],' +
          '[data-testid="kanban-column-TODO"] [data-testid="kanban-card"],' +
          '[data-testid="kanban-column-IN_PROGRESS"] [data-testid="kanban-card"],' +
          '[data-testid="kanban-column-REVIEW"] [data-testid="kanban-card"]',
      )
      .first();

    const firstCard = (await notDoneCard.isVisible().catch(() => false))
      ? notDoneCard
      : dndPage.locator('[data-testid="kanban-card"]').first();

    await expect(firstCard).toBeVisible({ timeout: 10_000 });

    const taskTitle = await firstCard.locator('[data-testid="task-title"]').textContent();

    const doneColumn = dndPage.locator('[data-testid="kanban-column-DONE"]');
    await expect(doneColumn).toBeVisible();

    const cardBounds = await firstCard.boundingBox();
    const colBounds = await doneColumn.boundingBox();
    await dndPage.mouse.move(
      cardBounds!.x + cardBounds!.width / 2,
      cardBounds!.y + cardBounds!.height / 2,
    );
    await dndPage.mouse.down();
    await dndPage.mouse.move(
      colBounds!.x + colBounds!.width / 2,
      colBounds!.y + colBounds!.height / 2,
      { steps: 20 },
    );
    await dndPage.mouse.up();

    await expect(doneColumn.getByText(taskTitle ?? '')).toBeVisible({ timeout: 10_000 });
  });
});
