import * as os from 'os';
import * as path from 'path';
import { readFileSync, readdirSync } from 'fs';
import { defineConfig, devices } from '@playwright/test';
import { environmentStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import { hasHonoOrExpressAdapterGuard } from '@dungeonmaster/shared/guards';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

// CI keeps one retry to absorb shared-runner infrastructure noise.
const CI_RETRIES = 1;
// Locally a retry HIDES the failure instead: a spec that fails then passes is reported green,
// which is how genuine product bugs sat behind an `e2e: PASS` — a paused dispatcher still
// running work, and a flow diagram rendering blank. Zero retries makes the suite honest.
const LOCAL_RETRIES = 0;
const DEFAULT_E2E_PORT = 5737;

const TEST_PORT = Number(process.env.DUNGEONMASTER_PORT) || DEFAULT_E2E_PORT;
const WEB_PORT = Number(process.env.DUNGEONMASTER_WEB_PORT) || TEST_PORT + 1;
const TEST_HOME = process.env.E2E_TEST_HOME ?? path.join(os.tmpdir(), `dm-e2e-${process.pid}`);
// Ward builds the UI once per hash of its inputs and hands the winning directory over here. The
// fallback is this package's own `dist`, which is what a hand-run `npx playwright test` gets after
// `npm run build --workspace=@dungeonmaster/web` — ward never reads or writes that path.
const BUNDLE_DIR = process.env.DUNGEONMASTER_WEB_BUNDLE_DIR ?? path.resolve(__dirname, 'dist');
const FAKE_CLAUDE_CLI = path.resolve(__dirname, 'test/harnesses/claude-mock/bin/claude');
const FAKE_CLAUDE_QUEUE_DIR = path.join(TEST_HOME, locationsStatics.siegelense.claudeQueueDir);
const FAKE_WARD_QUEUE_DIR = path.join(TEST_HOME, locationsStatics.siegelense.wardQueueDir);
const FAKE_WARD_CLI = path.resolve(
  __dirname,
  '../orchestrator/test-fixtures/fake-ward-bin/dungeonmaster-ward',
);
const REAL_HOME = os.homedir();

// The command below names the workspace this repo's own API server lives in. Hardcoding
// '@dungeonmaster/server' there is what no-hardcoded-package-names bans: this file is this repo's
// OWN e2e config and never ships to a consumer, so the portability concern the rule exists for does
// not apply to it directly — but the honest fix is the same one the rule asks for everywhere else,
// not an eslint-disable (banned outright by eslint-comments/no-use and by the pre-edit lint hook).
// Resolved off disk via the SAME signal `detectPackageTypeLayerBroker` uses for the 'http-backend'
// kind, so a repo rename or a package split is caught by a clear config-load throw instead of a
// silently stale hardcoded name. Exactly one packages/* directory must carry a hono or express
// adapter; zero or several is a repo-authoring mistake, not a case this file guesses through.
const PACKAGES_ROOT = path.resolve(__dirname, '..');

const resolveHttpBackendWorkspaceName = (): ContentText => {
  const packageDirNames = readdirSync(PACKAGES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const matches = packageDirNames.flatMap((dirName) => {
    const packageRoot = path.join(PACKAGES_ROOT, dirName);
    const adapterDirNames = (() => {
      try {
        return readdirSync(path.join(packageRoot, 'src', 'adapters'), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);
      } catch {
        return [];
      }
    })();
    if (!hasHonoOrExpressAdapterGuard({ adapterDirNames })) {
      return [];
    }
    const packageJson = JSON.parse(
      readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'),
    ) as Record<PropertyKey, unknown> | undefined;
    const packageName = packageJson?.name;
    return typeof packageName === 'string' ? [packageName] : [];
  });

  if (matches.length !== 1) {
    const found = matches.length === 0 ? '(none)' : matches.join(', ');
    throw new Error(
      `playwright.config.ts: expected exactly one packages/* directory detected as http-backend ` +
        `(a hono or express adapter), found ${String(matches.length)}: ${found}.`,
    );
  }
  const [httpBackendWorkspaceName] = matches;
  return contentTextContract.parse(httpBackendWorkspaceName);
};

const HTTP_BACKEND_WORKSPACE = resolveHttpBackendWorkspaceName();

process.env.E2E_TEST_HOME = TEST_HOME;
process.env.DUNGEONMASTER_PORT = String(TEST_PORT);
process.env.DUNGEONMASTER_HOME = TEST_HOME;
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(REAL_HOME, '.cache', 'ms-playwright');
process.env.HOME = TEST_HOME;
process.env.E2E_SERVER_HOME ??= TEST_HOME;

export default defineConfig({
  testDir: './src',
  // Specs are colocated in flows/<route> as *.e2e.ts. Playwright's default
  // testMatch only matches *.spec.ts/*.test.ts, so .e2e.ts must be declared
  // explicitly or zero tests would be discovered.
  testMatch: '**/*.e2e.ts',
  // Playwright CLEARS this folder when a run starts, and writes `.last-run.json` into it at the
  // end. Two concurrent runs sharing one folder means the second wipes the first's traces and
  // screenshots, so a failure that really happened loses the evidence for why. TEST_PORT is unique
  // per run, and nesting under test-results/ keeps the folder inside the gitignore entry that
  // already covers it. A passing run leaves an empty folder behind on purpose: deleting it would
  // also delete a FAILING run's traces, which are the whole reason the folder exists.
  outputDir: `./test-results/${String(TEST_PORT)}`,
  workers: 1,
  fullyParallel: false,
  timeout: 10_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI === undefined ? LOCAL_RETRIES : CI_RETRIES,
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
      // `dev:no-watch`, never `dev`. The server's `dev` script is `tsx watch`, and
      // `--conditions=source` puts every `packages/*/src/**` file in this repo into its module
      // graph — so ANY write anywhere in the tree restarts the API server mid-suite. The port is
      // gone for ~1.5 s while it reboots, Vite's `/api` proxy answers `ECONNREFUSED` with a bare
      // `500` and an EMPTY body, and whichever spec is in flight fails on whatever it happened to
      // be doing: `response.json()` on nothing (`SyntaxError: Unexpected end of JSON input`), a
      // POST that never reaches a handler, or a panel that never mounts because its quest fetch
      // died. Measured: an editor saving one file every ~14 s during a full run produced six such
      // failures, each timestamp-matched to a save. The suite has no use for a watcher — Playwright
      // starts this process once and tears it down at the end.
      command: `npm run dev:no-watch --workspace=${HTTP_BACKEND_WORKSPACE}`,
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
        // Registers the env-gated POST /api/quests/:questId/signal-back route so the fake Claude CLI
        // (which has no MCP client) can drive the operations-ledger relay over HTTP. Production never
        // sets this, so the route is never exposed outside e2e.
        E2E_SIGNAL_BACK_HTTP: '1',
        // Shorten the rate-limits.json poller from the production 5 s interval
        // so e2e tests aren't gated by the poll cycle. The orchestrator's
        // RateLimitsBootstrapResponder reads this env var on startup.
        DUNGEONMASTER_RATE_LIMITS_POLL_MS: '500',
      },
    },
    {
      // `preview`, never `dev`. This serves an ALREADY-BUILT directory as static files, so the
      // bundle cannot change under a spec: there is no watcher to silence and no module graph to
      // invalidate, and the suite skips both the dev server's startup and its per-request
      // transform. The `preview` block in vite.config.ts carries the port and the `/api` and `/ws`
      // proxies the specs reach the API server through.
      //
      // `--strictPort` because Playwright waits on exactly WEB_PORT: without it vite quietly picks
      // the next free port and the run dies on `Timed out waiting 60000ms from config.webServer`,
      // naming a timeout rather than the collision that caused it.
      command: `npx vite preview --strictPort --outDir "${BUNDLE_DIR}"`,
      port: WEB_PORT,
      reuseExistingServer: false,
      env: {
        DUNGEONMASTER_PORT: String(TEST_PORT),
        // Vite must listen on the SAME port Playwright waits for here. Both sides fall back to
        // `API port + 1`, and those two fallbacks agree only while one launcher picks both ports.
        // Passing it explicitly is what keeps them together when ward allocates them separately.
        DUNGEONMASTER_WEB_PORT: String(WEB_PORT),
      },
    },
  ],
});
