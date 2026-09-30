/**
 * PURPOSE: Directories every tsconfig-derived file discovery excludes, whatever the tsconfig says
 *
 * USAGE:
 * const exclude = [...tsconfigDiscoverStatics.defaultExclude];
 * // Returns: ['node_modules', 'dist']
 */

export const tsconfigDiscoverStatics = {
  defaultExclude: ['node_modules', 'dist'],
} as const;
