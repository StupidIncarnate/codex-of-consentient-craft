/**
 * PURPOSE: Which installed package owns each dungeonmaster binary, so a spawn runs THAT package's
 * own entry script — the run root's copy — instead of whatever a bare name finds on PATH. Reach for
 * this through packageBinResolveBroker.
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
    manifest: 'package.json',
  },
} as const;
