/**
 * PURPOSE: Default allowlists, file-suffix lists and the gateway import the no-bare-process-cwd rule tracks
 *
 * USAGE:
 * import { noBareProcessCwdStatics } from './no-bare-process-cwd-statics';
 * const defaults = noBareProcessCwdStatics.defaults;
 * // Returns { allowedFiles, allowedFolders, allowTestFiles }
 *
 * WHEN-TO-USE: When configuring the no-bare-process-cwd rule with default allowlists
 */
export const noBareProcessCwdStatics = {
  defaults: {
    // A tool's config file (vite, playwright, jest) is loaded by that tool as its process entry.
    allowedFiles: ['**/src/startup/start-install.ts', '**/*.config.{ts,js,mjs,cjs}'],
    // The entry layer (startup/, responders/) captures where it runs and passes repoRoot down.
    // Lower layers must receive repoRoot as a parameter: reading cwd ambiently inside long-running
    // server processes resolves the main checkout instead of the active quest worktree.
    // The gateway's process wrapper exports `cwd`; it is the one place that calls process.cwd().
    allowedFolders: [
      '**/packages/@gateway/node/src/process/**',
      '**/src/startup/**',
      '**/src/responders/**',
    ],
    allowTestFiles: true,
  },
  gateway: {
    processModule: '#gateway/node/process',
    cwdExport: 'cwd',
  },
  testCompanionSuffixes: ['.harness.ts', '.harness.tsx', '.proxy.ts', '.proxy.tsx'],
} as const;
