/**
 * PURPOSE: Decides whether a filename sits inside the scope that ban-sync-seeding-methods
 * enforces against (i.e. *.harness.ts files).
 *
 * USAGE:
 * isBanSyncSeedingMethodsScopeFileGuard({ filename: 'foo.harness.ts' })
 * // Returns true
 * isBanSyncSeedingMethodsScopeFileGuard({ filename: 'foo.ts' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the ban-sync-seeding-methods rule broker.
 */

export const isBanSyncSeedingMethodsScopeFileGuard = ({
  filename,
}: {
  filename?: string;
}): boolean => {
  if (filename === undefined || filename.length === 0) {
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');
  return normalized.endsWith('.harness.ts');
};
