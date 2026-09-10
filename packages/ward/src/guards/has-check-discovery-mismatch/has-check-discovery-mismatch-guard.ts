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
  // A SKIP carries its package's discovery count for the report while processing nothing, so on a
  // SCOPED run comparing the two reads every skip as a mismatch. That is the shape such a run
  // produces constantly: hand ward forty paths whose sources have no integration test between
  // them and that check skips, honestly, while still knowing the package holds seven. Counting it
  // reddened whole batches over a check that correctly declined to run.
  //
  // On a FULL run a skip keeps its vote, and that difference is the whole rule. Nothing narrowed
  // the scope there, so a package that discovered e2e specs and ran none of them has a real
  // question to answer, and this is what asks it.
  const counted = hasPassthrough
    ? check.projectResults.filter((pr) => pr.status !== 'skip')
    : check.projectResults;
  const totalFiles = counted.reduce((sum, pr) => sum + pr.filesCount, 0);
  const totalDiscovered = counted.reduce((sum, pr) => sum + pr.discoveredCount, 0);
  const isScopedWithResults = hasPassthrough && totalFiles > 0;
  return !isScopedWithResults && totalDiscovered > 0 && totalDiscovered !== totalFiles;
};
