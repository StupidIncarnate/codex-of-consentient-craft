/**
 * PURPOSE: Decides whether a filename sits inside the scope that ban-direct-io-in-test-scenarios
 * enforces against (i.e. *.e2e.ts, *.spec.ts, *.integration.test.ts files).
 *
 * USAGE:
 * isBanDirectIoScopeFileGuard({ filename: 'foo.spec.ts' })
 * // Returns true
 * isBanDirectIoScopeFileGuard({ filename: 'foo.ts' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the ban-direct-io-in-test-scenarios rule broker.
 */

export const isBanDirectIoScopeFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (filename === undefined || filename.length === 0) {
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');
  return /\.(?:e2e|spec|integration\.test)\.ts$/u.test(normalized);
};
