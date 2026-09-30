/**
 * PURPOSE: Detects a --onlyTests pattern that matched nothing anywhere in a run, as opposed to
 * individual packages that simply hold no test by that name
 *
 * USAGE:
 * hasUnmatchedTestNamePatternGuard({ wardResult: WardResultStub() });
 * // Returns: true when every project the pattern reached reported 'unmatched'
 *
 * WHEN-TO-USE: Once per run, to decide whether an empty --onlyTests filter is a typo
 * WHEN-NOT-TO-USE: Per package — a package without a matching test is a legitimate skip
 */

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';

export const hasUnmatchedTestNamePatternGuard = ({
  wardResult,
}: {
  wardResult?: WardResult;
}): boolean => {
  if (wardResult === undefined) {
    return false;
  }

  const reached = wardResult.checks
    .flatMap((check) => check.projectResults)
    .filter((projectResult) => projectResult.testNamePatternMatch !== undefined);

  return (
    reached.length > 0 &&
    !reached.some((projectResult) => projectResult.testNamePatternMatch === 'matched')
  );
};
