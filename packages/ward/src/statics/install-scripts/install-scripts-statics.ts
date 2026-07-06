/**
 * PURPOSE: Defines the npm scripts `dungeonmaster init` adds to a target project so `npm run ward`
 * (and the lint/typecheck/test aliases) resolve to the dungeonmaster-ward bin.
 *
 * USAGE:
 * installScriptsStatics.scripts.ward;
 * // Returns 'dungeonmaster-ward'
 */

export const installScriptsStatics = {
  scripts: {
    ward: 'dungeonmaster-ward',
    lint: 'dungeonmaster-ward --only lint',
    typecheck: 'dungeonmaster-ward --only typecheck',
    test: 'dungeonmaster-ward --only test',
  },
} as const;
