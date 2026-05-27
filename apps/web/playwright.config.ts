import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // run sequentially to share state across tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // ① Authenticate once — saves cookies/localStorage to playwright/.auth/*.json
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ② Login-flow tests — fresh browser, no stored auth (tests the login UI itself)
    //    Some describes inside 01-login.spec.ts opt-in to storageState via test.use()
    {
      name: 'login-flow',
      testMatch: /01-login\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // ③ All other tests — admin storageState injected automatically so no re-login needed
    {
      name: 'authenticated',
      testMatch: /0[234]-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
  // Uncomment to auto-start Next.js when running tests:
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
