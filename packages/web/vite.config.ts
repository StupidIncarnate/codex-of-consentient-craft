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
const webPort = basePort + 1;
const { hostname } = environmentStatics;

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
