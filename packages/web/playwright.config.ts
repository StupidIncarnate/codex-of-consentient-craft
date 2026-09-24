import * as os from 'os';
import * as path from 'path';
import { readFileSync } from 'fs';
import { defineConfig, devices } from '@playwright/test';
import { environmentStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import { osUserHomedirAdapter } from '@dungeonmaster/shared/adapters';
import { contentTextContract, networkPortContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, NetworkPort } from '@dungeonmaster/shared/contracts';
import { e2eUnresolvableTokenStatics } from './src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics';

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
const FAKE_CLAUDE_QUEUE_DIR = path.join(TEST_HOME, locationsStatics.siegelense.claudeQueueDir);
const FAKE_WARD_QUEUE_DIR = path.join(TEST_HOME, locationsStatics.siegelense.wardQueueDir);
const REAL_HOME = osUserHomedirAdapter();
// Every configured process below spawns with this as its `cwd` — the same repo root a siegelense
// lane always spawns from (`lane-boot-broker.ts`'s own `spawnCwd`), so a relative
// `devServer.e2e.processes[].command`/`env` value in `.dungeonmaster.json` resolves identically
// whichever one booted the server.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Ward builds the UI once per hash of its inputs and hands the winning directory over here via this
// env var — see check-run-e2e-broker.ts. Unset (a hand-run `npx playwright test`, or a siegelense
// lane, which never sets it) falls through to whatever `devServer.e2e.processes` names for the web
// process, ordinarily this package's own `dist` after `npm run build --workspace=@dungeonmaster/web`.
const WEB_BUNDLE_DIR_OVERRIDE = process.env.DUNGEONMASTER_WEB_BUNDLE_DIR;

process.env.E2E_TEST_HOME = TEST_HOME;
process.env.DUNGEONMASTER_PORT = String(TEST_PORT);
process.env.DUNGEONMASTER_HOME = TEST_HOME;
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(REAL_HOME, '.cache', 'ms-playwright');
process.env.HOME = TEST_HOME;
process.env.E2E_SERVER_HOME ??= TEST_HOME;
// Belt-and-suspenders alongside HOME=TEST_HOME + global-setup.ts's <TEST_HOME>/.gitconfig: a
// developer shell that exports its own XDG_CONFIG_HOME (pointing outside TEST_HOME) would
// otherwise still resolve to a REAL `$XDG_CONFIG_HOME/git/config`, and GIT_CONFIG_NOSYSTEM keeps
// `/etc/gitconfig` out of the picture too. Set here (this IS the Playwright test process — its
// workers fork after this module runs, so `process.env` is already correct for
// environment.harness.ts's own `execFileSync('git', ...)` calls) and again via
// `devServer.e2e.processes[].env` in `.dungeonmaster.json` below, matching every other var this
// file threads both ways.
process.env.GIT_CONFIG_NOSYSTEM = '1';
process.env.XDG_CONFIG_HOME = path.join(TEST_HOME, '.config');

// Reads the SAME devServer.e2e.processes block a siegelense lane derives its spec from
// (packages/siegelense/src/brokers/lane-spec/find/lane-spec-find-broker.ts) — one edit to
// .dungeonmaster.json reaches both, so this suite and a `dungeonmaster siegelense start` lane can
// never drift onto two different dev commands or two different fakes.
interface E2eProcessConfig {
  name: ContentText;
  command: ContentText;
  portRole: ContentText;
  readyPath: ContentText;
  env?: Record<PropertyKey, ContentText>;
}

interface DungeonmasterConfigShape {
  devServer?: { e2e?: { processes?: E2eProcessConfig[] } };
}

const CONFIG_PATH = path.join(REPO_ROOT, locationsStatics.repoRoot.config);

const readRawConfig = (): unknown => {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    throw new Error(
      `playwright.config.ts could not read or parse .dungeonmaster.json at ${CONFIG_PATH}: ${String(error)}`,
      { cause: error },
    );
  }
};

const processes = (readRawConfig() as DungeonmasterConfigShape).devServer?.e2e?.processes;

if (!Array.isArray(processes) || processes.length === 0) {
  throw new Error(
    'playwright.config.ts found no devServer.e2e.processes in .dungeonmaster.json — add the ' +
      "processes this repo's own dev server needs (name, command, portRole, readyPath, env).",
  );
}

const PORT_BY_ROLE: Record<PropertyKey, NetworkPort> = {
  api: networkPortContract.parse(TEST_PORT),
  web: networkPortContract.parse(WEB_PORT),
};

// `__dirname` IS this package's own directory at runtime — never a literal `packages/web/...`
// string, which `no-hardcoded-package-names` refuses inside an executable command.
const WEB_VITE_CONFIG_PATH = path.join(__dirname, 'vite.config.ts');

// Populated only when ward (or a hand-run `DUNGEONMASTER_WEB_BUNDLE_DIR=...`) names a prebuilt
// bundle — keyed by portRole, like PORT_BY_ROLE above, rather than a bare `=== 'web'` branch: see
// laneProcessPortResolveTransformer's own header for why `no-hardcoded-package-names` reads that
// comparison as deciding something ON a package name.
const OVERRIDE_COMMAND_BY_ROLE: Record<PropertyKey, ContentText> =
  WEB_BUNDLE_DIR_OVERRIDE === undefined
    ? {}
    : {
        web: contentTextContract.parse(
          `npx vite preview --config ${WEB_VITE_CONFIG_PATH} --strictPort --outDir "${WEB_BUNDLE_DIR_OVERRIDE}"`,
        ),
      };

// The five tokens `lanePlaceholderSubstituteTransformer` fills for a siegelense lane. {apiWorkspace}
// and {webWorkspace} are deliberately NOT in this list — this repo's own config never needs them (it
// names its workspaces literally), so a value using either refuses loudly below instead of spawning
// a command carrying the unexpanded token text.
const RESOLVABLE_TOKENS: Record<PropertyKey, ContentText> = {
  '{apiPort}': contentTextContract.parse(String(TEST_PORT)),
  '{webPort}': contentTextContract.parse(String(WEB_PORT)),
  '{home}': contentTextContract.parse(TEST_HOME),
  '{claudeQueueDir}': contentTextContract.parse(FAKE_CLAUDE_QUEUE_DIR),
  '{wardQueueDir}': contentTextContract.parse(FAKE_WARD_QUEUE_DIR),
};
const UNRESOLVABLE_TOKENS = e2eUnresolvableTokenStatics.tokens.all;

const substituteTokens = (value: string): ContentText =>
  contentTextContract.parse(
    Object.entries(RESOLVABLE_TOKENS).reduce(
      (result, [token, replacement]) => result.split(token).join(replacement),
      value,
    ),
  );

const refuseUnresolvableToken = ({ value, field }: { value: string; field: string }): void => {
  const token = UNRESOLVABLE_TOKENS.find((candidate) => value.includes(candidate));
  if (token !== undefined) {
    throw new Error(
      `playwright.config.ts: devServer.e2e.processes[].${field} in .dungeonmaster.json uses ${token}, ` +
        'which this file cannot resolve — write a literal value instead.',
    );
  }
};

// A repo-relative env value (contains "/", starts with neither "/" nor "@" — the same shape
// `isRelativePathEnvValueGuard` matches for a siegelense lane) resolves against REPO_ROOT, exactly
// as `laneEnvSubstituteTransformer` resolves it there — so CLAUDE_CLI_PATH/WARD_CLI_PATH read the
// same way whichever one spawned the server.
const isRelativePathEnvValue = (value: string): boolean =>
  !value.startsWith('/') && !value.startsWith('@') && value.includes('/');

const resolveEnvValue = (value: string): ContentText => {
  const substituted = substituteTokens(value);
  return isRelativePathEnvValue(substituted)
    ? contentTextContract.parse(path.join(REPO_ROOT, substituted))
    : substituted;
};

// `dev:no-watch`, never `dev`, for every configured process — see root CLAUDE.md's "Test isolation".
// `dev` is `tsx watch --conditions=source`, and `--conditions=source` resolves every
// `@dungeonmaster/*` import to TypeScript source, so ANY write anywhere in the tree restarts the
// process mid-suite: the port is gone for ~1.5s, Vite's `/api` proxy answers with a bare 500 and an
// empty body, and whichever spec is in flight fails on whatever it happened to be doing.
const webServer = processes.map((entry) => {
  const port = PORT_BY_ROLE[entry.portRole];
  if (port === undefined) {
    throw new Error(
      `playwright.config.ts: devServer.e2e.processes["${entry.name}"].portRole must be "api" or ` +
        '"web" in .dungeonmaster.json',
    );
  }

  refuseUnresolvableToken({ value: entry.command, field: 'command' });

  const env: Record<PropertyKey, ContentText> = {
    DUNGEONMASTER_PORT: contentTextContract.parse(String(TEST_PORT)),
    DUNGEONMASTER_WEB_PORT: contentTextContract.parse(String(WEB_PORT)),
  };
  for (const [key, value] of Object.entries(entry.env ?? {})) {
    refuseUnresolvableToken({ value, field: `env.${key}` });
    env[key] = resolveEnvValue(value);
  }

  const command = OVERRIDE_COMMAND_BY_ROLE[entry.portRole] ?? substituteTokens(entry.command);

  return {
    command,
    cwd: REPO_ROOT,
    // `--strictPort` on the web command (in .dungeonmaster.json) is what makes this url reachable:
    // without it vite quietly picks the next free port and this wait dies on
    // "Timed out waiting 60000ms from config.webServer", naming a timeout rather than the collision
    // that caused it.
    url: `http://${environmentStatics.hostname}:${String(port)}${substituteTokens(entry.readyPath)}`,
    // Never reuse: a server left over from an earlier session is serving an earlier build, and the
    // suite reports on code nobody is looking at.
    reuseExistingServer: false,
    env,
  };
});

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

  webServer,
});
