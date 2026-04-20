import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { environmentStatics } from '@dungeonmaster/shared/statics';

const sharedSubpaths = readdirSync(resolve(__dirname, '../shared'))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts')
  .map((file) => `@dungeonmaster/shared/${file.replace('.ts', '')}`);

const basePort = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
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
    include: [...sharedSubpaths, 'mermaid'],
    force: true,
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/u, /node_modules/u],
    },
  },
});
