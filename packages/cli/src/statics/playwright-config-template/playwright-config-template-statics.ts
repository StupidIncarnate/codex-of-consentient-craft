/**
 * PURPOSE: The self-contained Playwright config `dungeonmaster init` scaffolds into an end-user
 * repo. It carries a webServer block rather than test discovery alone, because a config without one
 * discovers specs that can never reach a running app — which is the state every fresh install used
 * to land in, and which surfaces to the operator only as an `unconfirmable` sign-off much later.
 * The command it names is deliberately one most repos do not have yet: npm fails loudly on the
 * missing script, next to the comment saying what to point it at and why that script must not watch.
 *
 * USAGE:
 * playwrightConfigTemplateStatics.content;
 * // Returns the literal playwright.config.ts file contents
 */

export const playwrightConfigTemplateStatics = {
  content: `import { defineConfig } from '@playwright/test';

// Ward's e2e runner asks the OS for a free API port and a free web port INDEPENDENTLY, then passes
// both. So the two numbers must never be guessed apart: Playwright waits on the port below and the
// dev server has to bind that same one. A run where they disagree dies on
// "Timed out waiting 60000ms from config.webServer" and says nothing else about why.
const API_PORT = Number(process.env.DUNGEONMASTER_PORT) || 3737;
const WEB_PORT = Number(process.env.DUNGEONMASTER_WEB_PORT) || API_PORT + 1;

export default defineConfig({
  testMatch: '**/*.e2e.ts',
  timeout: 30_000,

  // Specs navigate baseURL-relative, so no port ever reaches a test file.
  use: { baseURL: \`http://127.0.0.1:\${String(WEB_PORT)}\` },

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
} as const;
