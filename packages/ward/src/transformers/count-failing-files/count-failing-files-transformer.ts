/**
 * PURPOSE: Counts unique files with errors or test failures in a ProjectResult
 *
 * USAGE:
 * countFailingFilesTransformer({ projectResult: ProjectResultStub({ errors: [ErrorEntryStub()] }) });
 * // Returns: FilesCount branded number of unique failing file paths
 */

import type { ProjectResult } from '../../contracts/project-result/project-result-contract';
import { projectResultContract } from '../../contracts/project-result/project-result-contract';

type FilesCount = ProjectResult['filesCount'];

export const countFailingFilesTransformer = ({
  projectResult,
}: {
  projectResult: ProjectResult;
}): FilesCount => {
  const failingPaths = new Set([
    ...projectResult.errors.map((error) => error.filePath),
    ...projectResult.testFailures.map((failure) => failure.suitePath),
  ]);
  return projectResultContract.shape.filesCount.parse(failingPaths.size);
};
