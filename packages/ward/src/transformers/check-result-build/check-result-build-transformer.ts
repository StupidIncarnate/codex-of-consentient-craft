/**
 * PURPOSE: Builds a CheckResult from a check type and its project results, deriving overall status
 *
 * USAGE:
 * const checkResult = checkResultBuildTransformer({ checkType: 'lint', projectResults: [] });
 * // Returns CheckResult with status derived from project results
 */

import {
  checkResultContract,
  type CheckResult,
} from '../../contracts/check-result/check-result-contract';
import type { CheckType } from '../../contracts/check-type/check-type-contract';
import type { ProjectResult } from '../../contracts/project-result/project-result-contract';

export const checkResultBuildTransformer = ({
  checkType,
  projectResults,
}: {
  checkType: CheckType;
  projectResults: ProjectResult[];
}): CheckResult => {
  const hasFail = projectResults.some((pr) => pr.status === 'fail');
  return checkResultContract.parse({
    checkType,
    status: hasFail ? 'fail' : 'pass',
    projectResults,
  });
};
