/**
 * PURPOSE: Runs TypeScript type checking on a project folder and parses errors into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunTypecheckBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed TypeScript errors, filtered by fileList when provided
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
import { tscOutputParseTransformer } from '../../../transformers/tsc-output-parse/tsc-output-parse-transformer';

export const checkRunTypecheckBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const { command, args } = checkCommandsStatics.typecheck;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: [...args],
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  const allErrors = status === 'fail' ? tscOutputParseTransformer({ output: result.output }) : [];

  const fileSet = new Set(fileList.map(String));
  const errors =
    fileList.length > 0
      ? allErrors.filter((entry) => fileSet.has(String(entry.filePath)))
      : allErrors;

  const filteredStatus = errors.length > 0 ? 'fail' : 'pass';

  return projectResultContract.parse({
    projectFolder,
    status: filteredStatus,
    errors,
    testFailures: [],
    rawOutput: rawOutputContract.parse({
      stdout: '',
      stderr: '',
      exitCode,
    }),
  });
};
