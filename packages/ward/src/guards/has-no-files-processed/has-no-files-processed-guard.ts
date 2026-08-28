/**
 * PURPOSE: Answers "did this finished run examine a single file" from the checks that actually
 * narrow to a file scope. Reach for this over `hasCheckDiscoveryMismatchGuard`, which compares a
 * check's discovered set against its processed set: this asks the blunter question that mismatch
 * cannot, because a check with nothing discovered AND nothing processed agrees with itself.
 *
 * USAGE:
 * hasNoFilesProcessedGuard({ wardResult: WardResultStub() });
 * // Returns: true when every non-skipped, file-scoped check reported filesCount 0
 *
 * TYPECHECK IS EXCLUDED BY CLASSIFICATION, not by a filter written at the call site. `tsc` has no
 * way to check individual files, so ward runs it whole-package whatever the scope is: measured live,
 * `npm run ward -- --only typecheck -- scripts/build-workspaces.mjs` reports 6145 files for a path
 * tsc never saw. Counting it would make this answer `false` for every run that includes typecheck.
 *
 * A SKIPPED CHECK IS NOT EVIDENCE EITHER WAY, so it is dropped rather than counted as zero. Jest's
 * "No tests found" on a file-scoped run becomes `status: 'skip'`, and a package that is not
 * e2e-eligible skips e2e outright; a run left with no file-scoped check at all — `--only typecheck`
 * — therefore answers `false` rather than indicting a scope nothing was asked to look at.
 *
 * ONE CHECK PROCESSING SOMETHING IS ENOUGH. Jest's `--findRelatedTests` reports the related TEST
 * file rather than the source file it was handed, so a per-path answer is not derivable from what a
 * `ProjectResult` records — `filesCount` is a count, and `onlyProcessed` is a set difference against
 * discovery, not the processed list. The run-level count is the honest question this data answers.
 */

import type { CheckType } from '../../contracts/check-type/check-type-contract';
import type { WardResult } from '../../contracts/ward-result/ward-result-contract';

const HONORS_FILE_SCOPE_BY_CHECK_TYPE = {
  lint: true,
  typecheck: false,
  unit: true,
  integration: true,
  e2e: true,
} as const satisfies Record<CheckType, boolean>;

export const hasNoFilesProcessedGuard = ({ wardResult }: { wardResult?: WardResult }): boolean => {
  if (wardResult === undefined) {
    return false;
  }

  const fileScopedChecks = wardResult.checks.filter(
    (check) => HONORS_FILE_SCOPE_BY_CHECK_TYPE[check.checkType] && check.status !== 'skip',
  );

  if (fileScopedChecks.length === 0) {
    return false;
  }

  return fileScopedChecks.every(
    (check) => check.projectResults.reduce((sum, pr) => sum + pr.filesCount, 0) === 0,
  );
};
