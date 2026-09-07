import { playwrightConfigTemplateStatics } from './playwright-config-template-statics';

describe('playwrightConfigTemplateStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(playwrightConfigTemplateStatics).toStrictEqual({
      content: `import { defineConfig } from '@playwright/test';

const DEFAULT_API_PORT = 3737;

// Ward's e2e runner asks the OS for a free API port and a free web port INDEPENDENTLY, then passes
// both. So the two numbers must never be guessed apart: Playwright waits on the port below and the
// dev server has to bind that same one. A run where they disagree dies on
// "Timed out waiting 60000ms from config.webServer" and says nothing else about why.
const API_PORT = Number(process.env.DUNGEONMASTER_PORT) || DEFAULT_API_PORT;
const WEB_PORT = Number(process.env.DUNGEONMASTER_WEB_PORT) || API_PORT + 1;

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

  webServer: [
    {
      // REPLACE THIS with your app's dev script, and make that script a NO-WATCH one. A watching
      // dev server is the single largest source of mystery e2e failures, in two different ways:
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
      // An app whose API server is a separate process gets its OWN entry in this array, under the
      // same rule and pointing at API_PORT.
      command: 'npm run dev:no-watch',
      port: WEB_PORT,
      // Never reuse: a server left over from an earlier session is serving an earlier build, and
      // the suite reports on code nobody is looking at.
      reuseExistingServer: false,
      env: {
        DUNGEONMASTER_PORT: String(API_PORT),
        // Pass this through explicitly. Both this config and a typical dev config fall back to
        // "API port + 1", and those two fallbacks agree only while one launcher picks both ports.
        DUNGEONMASTER_WEB_PORT: String(WEB_PORT),
      },
    },
  ],
});
`,
    });
  });
});
