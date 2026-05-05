/**
 * PURPOSE: Configuration for the orphan-detect broker — the list of folder types whose
 * source files participate in reachability analysis from each package's startup files.
 *
 * USAGE:
 * architectureOrphanDetectStatics.walkedFolderTypes;
 * // ['adapters', 'bindings', 'brokers', 'flows', 'middleware', 'migrations', 'responders', 'startup', 'state', 'widgets']
 *
 * WHEN-TO-USE: orphan-detect layer brokers enumerating candidate files and seeding the
 * reachability walk from startup/.
 */

export const architectureOrphanDetectStatics = {
  walkedFolderTypes: [
    'adapters',
    'bindings',
    'brokers',
    'flows',
    'middleware',
    'migrations',
    'responders',
    'startup',
    'state',
    'widgets',
  ],
} as const;
