/**
 * PURPOSE: Runs Jest integration tests on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunIntegrationBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Jest integration test failures
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
import {
  errorEntryContract,
  type ErrorEntry,
} from '../../../contracts/error-entry/error-entry-contract';
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
import {
  fileTimingContract,
  type FileTiming,
} from '../../../contracts/file-timing/file-timing-contract';
import { isNonIntegrationTestGuard } from '../../../guards/is-non-integration-test/is-non-integration-test-guard';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { extractJsonObjectTransformer } from '../../../transformers/extract-json-object/extract-json-object-transformer';
import { jestJsonParseTransformer } from '../../../transformers/jest-json-parse/jest-json-parse-transformer';
import { jestDiscoverPatternsTransformer } from '../../../transformers/jest-discover-patterns/jest-discover-patterns-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';

export const checkRunIntegrationBroker = async ({
  projectFolder,
  fileList,
  testNamePattern,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
  testNamePattern?: string;
}): Promise<ProjectResult> => {
  const { bin, args } = checkCommandsStatics.integration;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const hasPackageJestConfig = fsExistsSyncAdapter({
    filePath: filePathContract.parse(`${String(cwd)}/jest.config.js`),
  });
  const { patterns } = jestDiscoverPatternsTransformer({
    checkType: 'integration',
    hasPackageJestConfig,
  });
  const { discoveredCount, discoveredFiles } = fsGlobSyncAdapter({
    patterns,
    cwd,
  });

  if (discoveredCount === 0) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      discoveredCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no test files discovered',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  const relevantFiles = fileList.filter((f) => !isNonIntegrationTestGuard({ filePath: String(f) }));

  if (fileList.length > 0 && relevantFiles.length === 0) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      discoveredCount,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no matching integration test files in passthrough',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  const dirs = relevantFiles.filter((f) => !String(f).includes('.'));
  const fileEntries = relevantFiles.filter((f) => String(f).includes('.'));
  const hasFiles = fileEntries.length > 0;
  const hasDirs = dirs.length > 0;

  if (!hasFiles && hasDirs) {
    const hasMatchingDiscovered = discoveredFiles.some((discovered) =>
      dirs.some((dir) => discovered.includes(String(dir))),
    );
    if (!hasMatchingDiscovered) {
      return projectResultContract.parse({
        projectFolder,
        status: 'skip',
        errors: [],
        testFailures: [],
        filesCount: 0,
        discoveredCount,
        rawOutput: rawOutputContract.parse({
          stdout: '',
          stderr: 'no matching integration test files in passthrough',
          exitCode: exitCodeContract.parse(0),
        }),
      });
    }
  }

  const baseArgs = [...args];
  if (hasDirs) {
    const dirPattern = dirs.map(String).join('|');
    const patternIndex = baseArgs.indexOf('--testPathPatterns');
    if (patternIndex >= 0) {
      const existingPattern = String(baseArgs[patternIndex + 1]);
      baseArgs[patternIndex + 1] = `(?:${dirPattern}).*${existingPattern}` as (typeof baseArgs)[0];
    }
  }
  const finalArgs = hasFiles
    ? [...baseArgs, '--runInBand', '--findRelatedTests', ...fileEntries]
    : hasDirs
      ? [...baseArgs, '--runInBand']
      : [...baseArgs, '--runInBand'];
  if (testNamePattern !== undefined) {
    finalArgs.push('--testNamePattern', testNamePattern);
  }
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
  let numPassedTests = 0;
  const processedFiles: GitRelativePath[] = [];
  const fileTimings: FileTiming[] = [];
  const errors: ErrorEntry[] = [];

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
    if (typeof parsed === 'object' && parsed !== null && 'numPassedTests' in parsed) {
      const count: unknown = Reflect.get(parsed, 'numPassedTests');
      if (typeof count === 'number') {
        numPassedTests = count;
      }
    }
    if (typeof parsed === 'object' && parsed !== null && 'testResults' in parsed) {
      const testResults: unknown = Reflect.get(parsed, 'testResults');
      if (Array.isArray(testResults)) {
        for (const tr of testResults) {
          if (typeof tr === 'object' && tr !== null && 'name' in tr) {
            const name: unknown = Reflect.get(tr, 'name');
            if (typeof name === 'string' && name.length > 0) {
              processedFiles.push(gitRelativePathContract.parse(name));
              if ('perfStats' in tr) {
                const perfStats: unknown = Reflect.get(tr, 'perfStats');
                if (typeof perfStats === 'object' && perfStats !== null) {
                  const start: unknown = Reflect.get(perfStats, 'start');
                  const end: unknown = Reflect.get(perfStats, 'end');
                  if (typeof start === 'number' && typeof end === 'number') {
                    fileTimings.push(
                      fileTimingContract.parse({
                        filePath: gitRelativePathContract.parse(name),
                        durationMs: end - start,
                      }),
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch {
    // non-JSON output, filesCount stays 0
  }

  if (resolvedStatus === 'pass' && testNamePattern !== undefined && numPassedTests === 0) {
    resolvedStatus = 'fail';
    errors.push(
      errorEntryContract.parse({
        filePath: 'jest',
        line: 0,
        column: 0,
        message: `--onlyTests pattern "${testNamePattern}" matched 0 tests — possible typo or stale test name`,
        severity: 'error',
      }),
    );
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
    testFailures,
    filesCount,
    discoveredCount,
    onlyDiscovered,
    onlyProcessed,
    fileTimings,
    rawOutput: rawOutputContract.parse({
      stdout: result.output,
      stderr: '',
      exitCode,
    }),
  });
};
