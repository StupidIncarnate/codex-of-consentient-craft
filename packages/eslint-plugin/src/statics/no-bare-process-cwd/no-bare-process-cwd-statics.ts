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
    // The gateway's own sanctioned wrapper — @dungeonmaster/node/process exports `cwd`,
    // the ONE place outside a path-resolver broker allowed to call process.cwd() directly;
    // everywhere else still goes through this rule.
    allowedFolders: ['**/packages/@gateway/node/src/process/**'],
    allowTestFiles: true,
  },
  testCompanionSuffixes: ['.harness.ts', '.harness.tsx', '.proxy.ts', '.proxy.tsx'],
} as const;
