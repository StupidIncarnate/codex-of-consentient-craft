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
    // elkjs (lib/main.js) does a guarded `require('web-worker')` for its optional
    // worker path. We run elk on the main thread (no workerUrl), so that require is
    // never reached at runtime — but esbuild's static dep-optimizer still tries to
    // resolve it and fails because `web-worker` is not installed. Mark it external so
    // esbuild leaves the require in place instead of bundling it.
    esbuildOptions: {
      external: ['web-worker'],
    },
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/u, /node_modules/u],
    },
    // Same reason as optimizeDeps above: keep `web-worker` external in the production
    // rollup build so elkjs's optional-worker require doesn't break bundling.
    rollupOptions: {
      external: ['web-worker'],
    },
  },
});
