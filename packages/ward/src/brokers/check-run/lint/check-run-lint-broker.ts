/**
 * PURPOSE: Runs ESLint on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunLintBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed ESLint errors
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
import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { eslintJsonParseTransformer } from '../../../transformers/eslint-json-parse/eslint-json-parse-transformer';
import { extractJsonArrayTransformer } from '../../../transformers/extract-json-array/extract-json-array-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';

export const checkRunLintBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
  testNamePattern?: string;
}): Promise<ProjectResult> => {
  const { bin, args, discoverPatterns } = checkCommandsStatics.lint;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const { discoveredCount, discoveredFiles } = fsGlobSyncAdapter({
    patterns: discoverPatterns,
    cwd,
  });
  const finalArgs = fileList.length > 0 ? [...args.slice(0, -1), ...fileList] : [...args];
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

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
  const processedFiles: GitRelativePath[] = [];

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
      for (const entry of parsed) {
        if (typeof entry === 'object' && entry !== null && 'filePath' in entry) {
          const fp: unknown = Reflect.get(entry, 'filePath');
          if (typeof fp === 'string' && fp.length > 0) {
            processedFiles.push(gitRelativePathContract.parse(fp));
          }
        }
      }
    }
  } catch {
    // non-JSON output, filesCount stays 0
  }

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  return projectResultContract.parse({
    projectFolder,
    status: resolvedStatus,
    errors,
    testFailures: [],
    filesCount,
    discoveredCount,
    onlyDiscovered,
    onlyProcessed,
    rawOutput: rawOutputContract.parse({
      stdout: result.output,
      stderr: '',
      exitCode,
    }),
  });
};
