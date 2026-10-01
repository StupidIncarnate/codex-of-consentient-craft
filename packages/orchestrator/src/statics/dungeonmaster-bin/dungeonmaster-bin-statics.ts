/**
 * PURPOSE: Which installed package owns each dungeonmaster binary the orchestrator spawns, so the spawn
 * can run THAT package's own entry script — the worktree's or the consumer's local copy — instead of
 * whatever a bare name finds on PATH. Reach for this through dungeonmasterBinResolveBroker.
 *
 * USAGE:
 * dungeonmasterBinStatics.packages['dungeonmaster-ward'];
 * // Returns '@dungeonmaster/ward'
 */

export const dungeonmasterBinStatics = {
  packages: {
    'dungeonmaster-ward': '@dungeonmaster/ward',
    dungeonmaster: '@dungeonmaster/cli',
  },
  layout: {
    modulesDir: 'node_modules',
    manifest: 'package.json',
  },
} as const;
