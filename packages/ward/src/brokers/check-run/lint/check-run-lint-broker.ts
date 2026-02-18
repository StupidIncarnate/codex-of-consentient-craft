/**
 * PURPOSE: Runs ESLint on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunLintBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed ESLint errors
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
import { eslintJsonParseTransformer } from '../../../transformers/eslint-json-parse/eslint-json-parse-transformer';
import { extractJsonArrayTransformer } from '../../../transformers/extract-json-array/extract-json-array-transformer';

export const checkRunLintBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const { command, args } = checkCommandsStatics.lint;
  const finalArgs = fileList.length > 0 ? [...args.slice(0, -1), ...fileList] : [...args];

  const cwd = absoluteFilePathContract.parse(projectFolder.path);

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: finalArgs,
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let errors: ReturnType<typeof eslintJsonParseTransformer> = [];
  let resolvedStatus = status;
  let filesCount = 0;

  if (status === 'fail') {
    try {
      errors = eslintJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      resolvedStatus = 'fail';
      errors = [];
    }
  }

  try {
    const jsonSlice = extractJsonArrayTransformer({ output: result.output });
    const parsed: unknown = JSON.parse(jsonSlice);
    if (Array.isArray(parsed)) {
      filesCount = parsed.length;
    }
  } catch {
    // non-JSON output, filesCount stays 0
  }

  return projectResultContract.parse({
    projectFolder,
    status: resolvedStatus,
    errors,
    testFailures: [],
    filesCount,
    rawOutput: rawOutputContract.parse({
      stdout: '',
      stderr: '',
      exitCode,
    }),
  });
};
