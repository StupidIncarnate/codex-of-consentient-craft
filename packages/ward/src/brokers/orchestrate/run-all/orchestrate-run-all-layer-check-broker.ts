/**
 * PURPOSE: Dispatches a single check type against a project folder using the appropriate check-run broker
 *
 * USAGE:
 * const result = await orchestrateRunAllLayerCheckBroker({ checkType: 'lint', projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult from the corresponding check-run broker
 */

import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import type { ProjectResult } from '../../../contracts/project-result/project-result-contract';
import { checkRunLintBroker } from '../../check-run/lint/check-run-lint-broker';
import { checkRunTypecheckBroker } from '../../check-run/typecheck/check-run-typecheck-broker';
import { checkRunTestBroker } from '../../check-run/test/check-run-test-broker';

export const orchestrateRunAllLayerCheckBroker = async ({
  checkType,
  projectFolder,
  fileList,
}: {
  checkType: CheckType;
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const runners = {
    lint: checkRunLintBroker,
    typecheck: checkRunTypecheckBroker,
    test: checkRunTestBroker,
  } as const;

  const runner = runners[checkType as keyof typeof runners];
  return runner({ projectFolder, fileList });
};
