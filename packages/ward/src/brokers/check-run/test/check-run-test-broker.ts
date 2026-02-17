/**
 * PURPOSE: Runs Jest on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunTestBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Jest test failures
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, exitCodeContract } from '@dungeonmaster/shared/contracts';

import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { jestJsonParseTransformer } from '../../../transformers/jest-json-parse/jest-json-parse-transformer';

export const checkRunTestBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const { command, args } = checkCommandsStatics.test;
  const finalArgs = fileList.length > 0
    ? [...args, '--findRelatedTests', ...fileList]
    : [...args];

  const cwd = absoluteFilePathContract.parse(projectFolder.path);

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: finalArgs,
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof jestJsonParseTransformer> = [];
  let resolvedStatus = status;

  if (status === 'fail') {
    try {
      testFailures = jestJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      resolvedStatus = 'fail';
      testFailures = [];
    }
  }

  return projectResultContract.parse({
    projectFolder,
    status: resolvedStatus,
    errors: [],
    testFailures,
    rawOutput: rawOutputContract.parse({
      stdout: result.output,
      stderr: '',
      exitCode,
    }),
  });
};
