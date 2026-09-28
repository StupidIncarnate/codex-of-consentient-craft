/**
 * PURPOSE: The ignore list session-list's glob scans pass to the gateway `glob`, which takes no
 * baked-in default. Kept as the same four patterns the deleted `globFindAdapter` hard-coded, so
 * switching to the gateway does not silently widen what the scan walks.
 *
 * USAGE:
 * await glob(pattern, { cwd, nodir: false, ignore: globIgnoreStatics.defaults });
 */
export const globIgnoreStatics = {
  defaults: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
} as const;
