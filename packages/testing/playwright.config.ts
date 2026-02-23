import * as os from 'os';
import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';
import { environmentStatics } from '@dungeonmaster/shared/statics';

const CI_RETRIES = 2;

const TEST_PORT = environmentStatics.testPort;
const TEST_HOME = process.env.DUNGEONMASTER_HOME ?? path.join(os.tmpdir(), `dm-e2e-${process.pid}`);
const FAKE_CLAUDE_CLI = path.resolve('e2e/web/harness/claude-mock/bin/claude');
const FAKE_CLAUDE_QUEUE_DIR = path.join(TEST_HOME, 'claude-queue');
const REAL_HOME = os.homedir();

process.env.DUNGEONMASTER_PORT = String(TEST_PORT);
process.env.DUNGEONMASTER_HOME = TEST_HOME;
process.env.PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH ?? path.join(REAL_HOME, '.cache', 'ms-playwright');
process.env.HOME = TEST_HOME;

export default defineConfig({
  testDir: './e2e/web',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? CI_RETRIES : 0,
  reporter: 'json',

  globalSetup: './e2e/web/global-setup.ts',
  globalTeardown: './e2e/web/global-teardown.ts',

  use: {
    baseURL: `http://${environmentStatics.hostname}:${TEST_PORT + 1}`,
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
      port: TEST_PORT,
      reuseExistingServer: false,
      env: {
        DUNGEONMASTER_PORT: String(TEST_PORT),
        DUNGEONMASTER_HOME: TEST_HOME,
        HOME: TEST_HOME,
        CLAUDE_CLI_PATH: FAKE_CLAUDE_CLI,
        FAKE_CLAUDE_QUEUE_DIR,
      },
    },
    {
      command: 'npm run dev --workspace=@dungeonmaster/web',
      port: TEST_PORT + 1,
      reuseExistingServer: false,
      env: {
        DUNGEONMASTER_PORT: String(TEST_PORT),
        DUNGEONMASTER_ENV: 'test',
      },
    },
  ],
});
