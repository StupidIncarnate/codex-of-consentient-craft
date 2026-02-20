/**
 * PURPOSE: Constants for workspace glob pattern parsing
 *
 * USAGE:
 * if (pattern.endsWith(workspaceGlobStatics.wildcardSuffix)) { ... }
 * // Checks if pattern ends with '/*' to determine if it's a glob
 */

export const workspaceGlobStatics = {
  wildcardSuffix: '/*',
  wildcardSuffixLength: 2,
} as const;
