/**
 * PURPOSE: Detects a project result that failed without producing any structured findings — the
 * check tool (or the child ward process running it) died instead of reporting on the code.
 *
 * USAGE:
 * isCrashedProjectResultGuard({ projectResult: ProjectResultStub({ status: 'fail' }) });
 * // Returns true when the project failed with zero errors and zero test failures
 */

import type { ProjectResult } from '../../contracts/project-result/project-result-contract';

export const isCrashedProjectResultGuard = ({
  projectResult,
}: {
  projectResult?: ProjectResult | undefined;
}): boolean =>
  projectResult !== undefined &&
  projectResult.status === 'fail' &&
  projectResult.errors.length === 0 &&
  projectResult.testFailures.length === 0;
