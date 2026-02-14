import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { environmentStatics } from '@dungeonmaster/shared/statics';

const basePort = Number(process.env.DUNGEONMASTER_PORT) || environmentStatics.defaultPort;
const webPort = basePort + 1;
const { hostname } = environmentStatics;

export default defineConfig({
  plugins: [react()],
  server: {
    port: webPort,
    host: hostname,
    proxy: {
      '/api': `http://${hostname}:${basePort}`,
      '/ws': {
        target: `ws://${hostname}:${basePort}`,
        ws: true,
      },
    },
  },
  cacheDir: `node_modules/.vite-${basePort}`,
  optimizeDeps: {
    include: ['@dungeonmaster/shared/contracts'],
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/shared/u, /node_modules/u],
    },
  },
});
