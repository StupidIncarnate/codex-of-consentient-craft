/**
 * PURPOSE: Default allowlists and file-suffix lists for the no-bare-process-cwd rule
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
    allowedFiles: ['**/src/startup/start-install.ts'],
    allowedFolders: ['**/src/adapters/process/cwd/**'],
    allowTestFiles: true,
  },
  testCompanionSuffixes: ['.harness.ts', '.harness.tsx', '.proxy.ts', '.proxy.tsx'],
} as const;
