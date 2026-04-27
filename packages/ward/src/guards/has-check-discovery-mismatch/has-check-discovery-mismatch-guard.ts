/**
 * PURPOSE: Detects whether a check has a discovery mismatch (files discovered ≠ files processed) outside of scoped runs
 *
 * USAGE:
 * hasCheckDiscoveryMismatchGuard({ check: CheckResultStub(), hasPassthrough: false });
 * // Returns: true when totalDiscovered > 0 and totalDiscovered !== totalFiles, suppressed when scoped run had results
 */

import type { CheckResult } from '../../contracts/check-result/check-result-contract';

export const hasCheckDiscoveryMismatchGuard = ({
  check,
  hasPassthrough,
}: {
  check?: CheckResult;
  hasPassthrough?: boolean;
}): boolean => {
  if (check === undefined || hasPassthrough === undefined) {
    return false;
  }
  const totalFiles = check.projectResults.reduce((sum, pr) => sum + pr.filesCount, 0);
  const totalDiscovered = check.projectResults.reduce((sum, pr) => sum + pr.discoveredCount, 0);
  const isScopedWithResults = hasPassthrough && totalFiles > 0;
  return !isScopedWithResults && totalDiscovered > 0 && totalDiscovered !== totalFiles;
};
