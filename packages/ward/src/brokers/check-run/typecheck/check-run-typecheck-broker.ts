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
import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { tscOutputParseTransformer } from '../../../transformers/tsc-output-parse/tsc-output-parse-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';

export const checkRunTypecheckBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
  testNamePattern?: string;
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

  const { bin, args, discoverPatterns } = checkCommandsStatics.typecheck;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const { discoveredCount, discoveredFiles } = fsGlobSyncAdapter({
    patterns: discoverPatterns,
    cwd,
  });
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

  const cwdPrefix = `${String(cwd)}/`;
  const processedFiles: GitRelativePath[] = [];
  const tscLines = result.output.split('\n');

  for (const line of tscLines) {
    if (line.startsWith(cwdPrefix) && !line.includes('node_modules')) {
      processedFiles.push(gitRelativePathContract.parse(line.slice(cwdPrefix.length)));
    }
  }

  const filesCount = processedFiles.length;

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  const strippedOutput = tscLines.filter((line) => !line.startsWith('/')).join('\n');

  return projectResultContract.parse({
    projectFolder,
    status: filteredStatus,
    errors,
    testFailures: [],
    filesCount,
    discoveredCount,
    onlyDiscovered,
    onlyProcessed,
    rawOutput: rawOutputContract.parse({
      stdout: strippedOutput,
      stderr: '',
      exitCode,
    }),
  });
};
