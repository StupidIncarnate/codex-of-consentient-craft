import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { portResolveBroker } from '@dungeonmaster/shared/brokers';
import { environmentStatics } from '@dungeonmaster/shared/statics';

const sharedSubpaths = readdirSync(resolve(__dirname, '../shared'))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts')
  .map((file) => `@dungeonmaster/shared/${file.replace('.ts', '')}`);

const basePort = Number(portResolveBroker());
// DUNGEONMASTER_WEB_PORT wins whenever the launcher allocated the two ports separately — ward's
// e2e runner asks the OS for both, so its web port is NOT basePort + 1 and guessing it here
// leaves Playwright waiting on a port nothing ever binds. The +1 is the fallback for `npm run
// dev`, which sets only the API port.
const webPort = Number(process.env.DUNGEONMASTER_WEB_PORT) || basePort + 1;
const { hostname } = environmentStatics;

// Set by `dev:no-watch`, for driving this app against a bundle that must not move under you —
// a manual walk-through, or a harness that wants the dev server rather than the `preview` block
// below. `hmr: false` stops Vite pushing a reload into the page you are mid-assertion on, and
// `watch: null` (chokidar off, per Vite's own ServerOptions docs) stops it noticing an edit at
// all — without the second one Vite still invalidates the changed module and serves the new code
// to the next `page.goto`, so an edit part-way through splits a run across two versions of the
// tree with nothing saying so. Symptom when this regresses: a page that never boots — zero
// network requests, a blank white screenshot — then a timeout on whatever was awaited.
const noWatch = process.env.E2E_NO_WATCH === '1';
const frozenServerOptions = noWatch ? { hmr: false as const, watch: null } : {};

export default defineConfig({
  resolve: {
    conditions: ['source'],
    alias: {
      // elkjs's Node entry (lib/main.js) does a guarded `require('web-worker')` for its
      // optional worker path. The elk layout adapter runs elk on the main thread (no
      // workerUrl), so that require is never reached at runtime, but the bundler must
      // still resolve the specifier. Alias it to a no-op stub so it bundles inline:
      // marking it `external` instead leaves a bare `import "web-worker"` that the
      // browser fails to resolve at runtime.
      'web-worker': resolve(__dirname, 'web-worker-stub.mjs'),
    },
  },
  plugins: [react()],
  server: {
    port: webPort,
    host: hostname,
    ...frozenServerOptions,
    proxy: {
      '/api': `http://${hostname}:${basePort}`,
      '^/ws$': {
        target: `ws://${hostname}:${basePort}`,
        ws: true,
      },
    },
  },
  preview: {
    port: webPort,
    host: hostname,
    proxy: {
      '/api': `http://${hostname}:${basePort}`,
      '^/ws$': {
        target: `ws://${hostname}:${basePort}`,
        ws: true,
      },
    },
  },
  cacheDir: `node_modules/.vite-${basePort}`,
  optimizeDeps: {
    include: [...sharedSubpaths],
    force: true,
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/u, /node_modules/u],
    },
  },
});
