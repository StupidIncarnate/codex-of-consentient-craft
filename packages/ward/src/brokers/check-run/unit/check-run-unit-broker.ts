/**
 * PURPOSE: Runs Jest unit tests on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunUnitBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Jest test failures
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, exitCodeContract } from '@dungeonmaster/shared/contracts';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { extractJsonObjectTransformer } from '../../../transformers/extract-json-object/extract-json-object-transformer';
import { jestJsonParseTransformer } from '../../../transformers/jest-json-parse/jest-json-parse-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';

export const checkRunUnitBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const { bin, args } = checkCommandsStatics.unit;
  const finalArgs =
    fileList.length > 0 ? [...args, '--runInBand', '--findRelatedTests', ...fileList] : [...args];

  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: finalArgs,
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof jestJsonParseTransformer> = [];
  let resolvedStatus = status;
  let filesCount = 0;

  if (status === 'fail') {
    try {
      testFailures = jestJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      resolvedStatus = 'fail';
      testFailures = [];
    }
  }

  try {
    const jsonSlice = extractJsonObjectTransformer({ output: result.output });
    const parsed: unknown = JSON.parse(jsonSlice);
    if (typeof parsed === 'object' && parsed !== null && 'numTotalTestSuites' in parsed) {
      const count: unknown = Reflect.get(parsed, 'numTotalTestSuites');
      if (typeof count === 'number') {
        filesCount = count;
      }
    }
  } catch {
    // non-JSON output, filesCount stays 0
  }

  return projectResultContract.parse({
    projectFolder,
    status: resolvedStatus,
    errors: [],
    testFailures,
    filesCount,
    rawOutput: rawOutputContract.parse({
      stdout: result.output,
      stderr: '',
      exitCode,
    }),
  });
};
