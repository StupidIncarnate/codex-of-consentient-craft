/**
 * PURPOSE: Holds the static configuration for the ban-sync-seeding-methods ESLint rule.
 *
 * USAGE:
 * banSyncSeedingMethodsStatics.seedingPrefixes
 * // Returns ['seed', 'create', ...]
 */
export const banSyncSeedingMethodsStatics = {
  seedingPrefixes: ['seed', 'create', 'write', 'patch', 'stamp'],
} as const;
