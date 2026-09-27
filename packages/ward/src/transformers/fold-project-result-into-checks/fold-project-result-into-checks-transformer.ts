/**
 * PURPOSE: Folds one extra `ProjectResult` into the matching `CheckResult` of an already-built
 * `checks` array, rebuilding that single entry's status through `checkResultBuildTransformer` so a
 * failing extra result flips the check to `fail` the same way any other package's result would.
 * `singlePackageLayerBroker` and `multiPackageLayerBroker` both call this AFTER their own per-package
 * loop finishes, never inside it — the extra result (the platform-crossing/duplicate-install
 * finding) is computed once for the whole repo by `commandRunBroker`, not once per package.
 *
 * USAGE:
 * foldProjectResultIntoChecksTransformer({checks, checkType: 'lint', extraProjectResult});
 * // Returns checks with the 'lint' entry's projectResults carrying extraProjectResult too
 */

import type { CheckResult } from '../../contracts/check-result/check-result-contract';
import type { CheckType } from '../../contracts/check-type/check-type-contract';
import type { ProjectResult } from '../../contracts/project-result/project-result-contract';
import { checkResultBuildTransformer } from '../check-result-build/check-result-build-transformer';

export const foldProjectResultIntoChecksTransformer = ({
  checks,
  checkType,
  extraProjectResult,
}: {
  checks: CheckResult[];
  checkType: CheckType;
  extraProjectResult?: ProjectResult;
}): CheckResult[] => {
  if (extraProjectResult === undefined) {
    return checks;
  }

  return checks.map((check) =>
    check.checkType === checkType
      ? checkResultBuildTransformer({
          checkType: check.checkType,
          projectResults: [...check.projectResults, extraProjectResult],
          durationMs: check.durationMs,
        })
      : check,
  );
};
