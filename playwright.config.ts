import { defineConfig, devices } from '@playwright/test';

const CI_RETRIES = 2;

export default defineConfig({
  testDir: './tests/e2e/web',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? CI_RETRIES : 0,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev --workspace=@dungeonmaster/server',
      port: 3737,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev --workspace=@dungeonmaster/web',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
