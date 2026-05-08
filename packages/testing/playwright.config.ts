import * as os from 'os';
import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';
import { environmentStatics } from '@dungeonmaster/shared/statics';

const CI_RETRIES = 1;
const DEFAULT_E2E_PORT = 5737;

const TEST_PORT = Number(process.env.DUNGEONMASTER_PORT) || DEFAULT_E2E_PORT;
const WEB_PORT = Number(process.env.DUNGEONMASTER_WEB_PORT) || TEST_PORT + 1;
const TEST_HOME = process.env.E2E_TEST_HOME ?? path.join(os.tmpdir(), `dm-e2e-${process.pid}`);
const FAKE_CLAUDE_CLI = path.resolve(__dirname, 'test/harnesses/claude-mock/bin/claude');
const FAKE_CLAUDE_QUEUE_DIR = path.join(TEST_HOME, 'claude-queue');
const FAKE_WARD_QUEUE_DIR = path.join(TEST_HOME, 'ward-queue');
const FAKE_WARD_CLI = path.resolve(
  __dirname,
  '../orchestrator/test-fixtures/fake-ward-bin/dungeonmaster-ward',
);
const REAL_HOME = os.homedir();

process.env.E2E_TEST_HOME = TEST_HOME;
process.env.DUNGEONMASTER_PORT = String(TEST_PORT);
process.env.DUNGEONMASTER_HOME = TEST_HOME;
process.env.PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH ?? path.join(REAL_HOME, '.cache', 'ms-playwright');
process.env.HOME = TEST_HOME;
process.env.E2E_SERVER_HOME = process.env.E2E_SERVER_HOME ?? TEST_HOME;

export default defineConfig({
  testDir: './e2e/web',
  workers: 1,
  fullyParallel: false,
  timeout: 10_000,
  forbidOnly: Boolean(process.env.CI),
  retries: CI_RETRIES,
  reporter: 'json',

  globalSetup: './test/harnesses/global-setup.ts',
  globalTeardown: './test/harnesses/global-teardown.ts',

  use: {
    baseURL: `http://${environmentStatics.hostname}:${WEB_PORT}`,
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
        FAKE_WARD_QUEUE_DIR,
        WARD_CLI_PATH: FAKE_WARD_CLI,
        // Shorten the rate-limits.json poller from the production 5 s interval
        // so e2e tests aren't gated by the poll cycle. The orchestrator's
        // RateLimitsBootstrapResponder reads this env var on startup.
        DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500',
      },
    },
    {
      command: 'npm run dev --workspace=@dungeonmaster/web',
      port: WEB_PORT,
      reuseExistingServer: false,
      env: {
        DUNGEONMASTER_PORT: String(TEST_PORT),
      },
    },
  ],
});
