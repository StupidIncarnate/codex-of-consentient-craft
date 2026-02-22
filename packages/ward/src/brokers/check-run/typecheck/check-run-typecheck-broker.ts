/**
 * PURPOSE: Runs TypeScript type checking on a project folder and parses errors into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunTypecheckBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed TypeScript errors, filtered by fileList when provided
 */

import {
  childProcessSpawnCaptureAdapter,
  fsExistsSyncAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  exitCodeContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';

import { binCommandContract } from '../../../contracts/bin-command/bin-command-contract';
import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { tscOutputParseTransformer } from '../../../transformers/tsc-output-parse/tsc-output-parse-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';

export const checkRunTypecheckBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const tsconfigPath = filePathContract.parse(`${projectFolder.path}/tsconfig.json`);
  if (!fsExistsSyncAdapter({ filePath: tsconfigPath })) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no tsconfig.json',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  const { bin, args } = checkCommandsStatics.typecheck;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: [...args],
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let allErrors: ReturnType<typeof tscOutputParseTransformer> = [];

  if (status === 'fail') {
    try {
      allErrors = tscOutputParseTransformer({ output: result.output });
    } catch {
      allErrors = [];
    }
  }

  const fileSet = new Set(fileList.map(String));
  const errors =
    fileList.length > 0
      ? allErrors.filter((entry) => fileSet.has(String(entry.filePath)))
      : allErrors;

  const filteredStatus = fileList.length > 0 && errors.length === 0 ? 'pass' : status;

  const filesCount = result.output
    .split('\n')
    .filter((line) => line.startsWith('/') && !line.includes('node_modules')).length;

  return projectResultContract.parse({
    projectFolder,
    status: filteredStatus,
    errors,
    testFailures: [],
    filesCount,
    rawOutput: rawOutputContract.parse({
      stdout: result.output,
      stderr: '',
      exitCode,
    }),
  });
};
