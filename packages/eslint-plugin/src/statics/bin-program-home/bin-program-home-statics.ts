/**
 * PURPOSE: Maps a spawned program's exact name to its `@<scope>/bin/<program>` home and one real
 * exported function name to name in the lint message. Shipped as a fixed list rather than read from
 * `packages/bin/src/**` at lint time: a published consumer repo adopting the gateway convention has
 * no reason to name its own bin folders identically to this repo's, and reading the filesystem once
 * per linted file (or once per process with no invalidation) is unneeded I/O for a table this small.
 * `bin-program-home-statics.test.ts` pins this list's exact shape, so an edit here is a deliberate,
 * reviewable diff rather than a silent drift. It is not verified against the live `packages/bin/src/`
 * tree: `get-testing-patterns` reserves `.integration.test.ts` for startup files and flows, and this
 * is neither.
 *
 * USAGE:
 * binProgramHomeStatics.programs.git;
 * // Returns { binFunction: 'currentBranch' }
 */
export const binProgramHomeStatics = {
  programs: {
    git: { binFunction: 'currentBranch' },
    npm: { binFunction: 'install' },
    claude: { binFunction: 'spawnStreamJson' },
    cp: { binFunction: 'copyRecursive' },
    lsof: { binFunction: 'listeningPids' },
    kill: { binFunction: 'killPid' },
  },
} as const;
