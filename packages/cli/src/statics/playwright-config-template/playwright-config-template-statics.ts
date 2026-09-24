/**
 * PURPOSE: The self-contained Playwright config `dungeonmaster init` scaffolds into an end-user
 * repo. It reads `devServer.e2e.processes` straight out of `.dungeonmaster.json` — the SAME block
 * siegelense's own lane-derive broker reads — rather than importing `@dungeonmaster/config`:
 * `devDependenciesStatics` (what `InstallAddDevDepsResponder` actually adds) never lists that
 * package, so nothing guarantees it resolves from a fresh consumer's `node_modules`. Parsing the
 * JSON directly needs nothing beyond `node:fs`/`node:path`, which every consumer already has. A
 * config still holding the unedited seeded placeholder, or missing `devServer.e2e` entirely, fails
 * at load with a message naming the field to edit — the same refusal siegelense's own derive broker
 * gives for the same two conditions.
 *
 * USAGE:
 * playwrightConfigTemplateStatics.content;
 * // Returns the literal playwright.config.ts file contents
 */

export const playwrightConfigTemplateStatics = {
  content: `import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_API_PORT = 3737;

// Ward's e2e runner asks the OS for a free API port and a free web port INDEPENDENTLY, then passes
// both. So the two numbers must never be guessed apart: Playwright waits on the port below and the
// dev server has to bind that same one. A run where they disagree dies on
// "Timed out waiting 60000ms from config.webServer" and says nothing else about why.
const API_PORT = Number(process.env.DUNGEONMASTER_PORT) || DEFAULT_API_PORT;
const WEB_PORT = Number(process.env.DUNGEONMASTER_WEB_PORT) || API_PORT + 1;
const PORT_BY_ROLE: Record<string, number> = { api: API_PORT, web: WEB_PORT };

type E2eProcessConfig = {
  name: string;
  command: string;
  portRole: string;
  readyPath: string;
  env?: Record<string, string>;
};

type DungeonmasterConfigShape = {
  devServer?: {
    e2e?: {
      processes?: E2eProcessConfig[];
    };
  };
};

// Both this file and siegelense read devServer.e2e.processes out of the SAME .dungeonmaster.json —
// one edit reaches both, so the lane and this suite never drift onto two different dev commands.
const CONFIG_PATH = join(__dirname, '.dungeonmaster.json');

let rawConfig: unknown;
try {
  rawConfig = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
} catch (error) {
  throw new Error(
    \`playwright.config.ts could not read or parse .dungeonmaster.json at \${CONFIG_PATH}: \${String(error)}\`,
  );
}

const processes = (rawConfig as DungeonmasterConfigShape).devServer?.e2e?.processes;

if (!Array.isArray(processes) || processes.length === 0) {
  throw new Error(
    'playwright.config.ts found no devServer.e2e.processes in .dungeonmaster.json — edit that array ' +
      "to name your app's own no-watch dev command (name, command, portRole, readyPath), the same way " +
      'you would write a Playwright webServer entry.',
  );
}

// The literal seeded placeholder \`dungeonmaster init\` writes when nobody has pointed
// devServer.e2e.processes at a real app yet — refuse it by name instead of letting the shell fail
// on "npm run dev:no-watch" with no hint which config field to edit.
const firstProcess = processes[0];
const isUneditedPlaceholder =
  processes.length === 1 &&
  firstProcess?.name === 'app' &&
  firstProcess?.command === 'npm run dev:no-watch' &&
  firstProcess?.portRole === 'api' &&
  firstProcess?.readyPath === '/' &&
  Object.keys(firstProcess?.env ?? {}).length === 1 &&
  firstProcess?.env?.PORT === '{apiPort}';

if (isUneditedPlaceholder) {
  throw new Error(
    'playwright.config.ts found the unedited placeholder in devServer.e2e.processes[0] — edit ' +
      "devServer.e2e.processes in .dungeonmaster.json to point at your app's own no-watch dev command.",
  );
}

const RESOLVABLE_TOKENS: Record<string, string> = {
  '{apiPort}': String(API_PORT),
  '{webPort}': String(WEB_PORT),
};

// {apiWorkspace}/{webWorkspace} need this repo's own package-type detection, and {claudeQueueDir}/
// {wardQueueDir} need siegelense's own per-instance mkdir — neither exists in a scaffolded file
// that imports nothing beyond node:fs/node:path, so a value using one of these fails loudly here
// instead of spawning a command that still carries the literal, unexpanded token text.
const UNRESOLVABLE_TOKENS = ['{apiWorkspace}', '{webWorkspace}', '{claudeQueueDir}', '{wardQueueDir}'];

const substituteTokens = (value: string): string =>
  Object.entries(RESOLVABLE_TOKENS).reduce(
    (result, [token, replacement]) => result.split(token).join(replacement),
    value,
  );

const refuseUnresolvableToken = ({ value, field }: { value: string; field: string }): void => {
  const token = UNRESOLVABLE_TOKENS.find((candidate) => value.includes(candidate));
  if (token !== undefined) {
    throw new Error(
      \`playwright.config.ts: devServer.e2e.processes[].\${field} in .dungeonmaster.json uses \${token}, \` +
        'which this scaffolded config cannot resolve — write a literal value instead.',
    );
  }
};

// EDIT devServer.e2e.processes in .dungeonmaster.json to point at your app's own dev command —
// never this file — and make that command a NO-WATCH one. A watching dev server is the single
// largest source of mystery e2e failures, in two different ways:
//
//   1. A watcher that RESTARTS the process (tsx watch, nodemon, ts-node-dev) takes the port
//      down for a second or two mid-suite. Whatever was in flight gets a bare 500 with an
//      empty body, which surfaces as "SyntaxError: Unexpected end of JSON input", as
//      waitForResponse timeouts, and as panels that never mount. Several unrelated-looking
//      specs fail at once and none of them is actually broken.
//   2. A watcher that HOT-RELOADS (vite, webpack-dev-server) pushes a reload into the page a
//      spec is mid-assertion on. Measured symptom: the page never came back — zero network
//      requests after the reload, a blank white screenshot, no Playwright page snapshot at
//      all, then a timeout on whatever the spec was waiting for.
//
// For Vite, silencing HMR is NOT enough. Set both of these in vite.config.ts, behind an env
// flag that only your no-watch script sets:
//
//   server: { hmr: false, watch: null }
//
// watch: null turns chokidar off (per Vite's own ServerOptions docs). Without it Vite still
// invalidates the changed module and serves the new code to the next page.goto, so an edit
// part-way through a run silently splits the suite across two versions of the tree, with
// nothing in the report saying so.
//
// A split api/web app names TWO entries in devServer.e2e.processes — one portRole: 'api', one
// portRole: 'web' — and both land in the array below.
const webServer = processes.map((entry) => {
  if (entry.portRole !== 'api' && entry.portRole !== 'web') {
    throw new Error(
      \`playwright.config.ts: devServer.e2e.processes["\${entry.name}"].portRole must be "api" or \` +
        '"web" in .dungeonmaster.json',
    );
  }

  refuseUnresolvableToken({ value: entry.command, field: 'command' });
  const port = PORT_BY_ROLE[entry.portRole];

  const env: Record<string, string> = {
    DUNGEONMASTER_PORT: String(API_PORT),
    DUNGEONMASTER_WEB_PORT: String(WEB_PORT),
  };
  for (const [key, value] of Object.entries(entry.env ?? {})) {
    refuseUnresolvableToken({ value, field: \`env.\${key}\` });
    env[key] = substituteTokens(value);
  }

  return {
    command: substituteTokens(entry.command),
    url: \`http://127.0.0.1:\${String(port)}\${substituteTokens(entry.readyPath)}\`,
    // Never reuse: a server left over from an earlier session is serving an earlier build, and
    // the suite reports on code nobody is looking at.
    reuseExistingServer: false,
    env,
  };
});

export default defineConfig({
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,

  // Specs navigate baseURL-relative, so no port ever reaches a test file.
  use: { baseURL: \`http://127.0.0.1:\${String(WEB_PORT)}\` },

  // Playwright CLEARS this folder when a run starts. Two runs sharing one folder means the second
  // wipes the first's traces and screenshots, so a failure that really happened loses the evidence
  // for why — which is what nesting it under the run's own port prevents. Ward reaps these once
  // they are a week old, so a passing run leaving an empty folder behind costs nothing.
  //
  // DO THE SAME FOR VITE, in vite.config.ts, or parallel runs corrupt each other's
  // dependency-optimizer cache:
  //
  //   cacheDir: \`node_modules/.vite-\${API_PORT}\`
  //
  // Ward removes that directory at the end of the run that made it, and sweeps any left by a run
  // that was killed first — so the per-port split costs no disk. Without ward doing that, one
  // cache per run accumulates at roughly 39 MB each and nothing ever evicts them.
  outputDir: \`test-results/\${String(API_PORT)}\`,

  webServer,
});
`,
} as const;
