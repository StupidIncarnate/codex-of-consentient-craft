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
import {
  openHandleContract,
  type OpenHandle,
} from '../../../contracts/open-handle/open-handle-contract';
import { isNonIntegrationTestGuard } from '../../../guards/is-non-integration-test/is-non-integration-test-guard';
import { isNoTestsFoundGuard } from '../../../guards/is-no-tests-found/is-no-tests-found-guard';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { jestJsonReportContract } from '../../../contracts/jest-json-report/jest-json-report-contract';
import { extractJsonObjectTransformer } from '../../../transformers/extract-json-object/extract-json-object-transformer';
import { jestJsonParseTransformer } from '../../../transformers/jest-json-parse/jest-json-parse-transformer';
import { jestJsonParsePassingTransformer } from '../../../transformers/jest-json-parse-passing/jest-json-parse-passing-transformer';
import { jestDiscoverPatternsTransformer } from '../../../transformers/jest-discover-patterns/jest-discover-patterns-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { openHandleReportParseTransformer } from '../../../transformers/open-handle-report-parse/open-handle-report-parse-transformer';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';
import { openHandleReportStatics } from '../../../statics/open-handle-report/open-handle-report-statics';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { osTmpdirAdapter } from '../../../adapters/os/tmpdir/os-tmpdir-adapter';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { sourceConditionSupportedBroker } from '../../source-condition/supported/source-condition-supported-broker';
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
  const { bin, args, relatedTestsIgnorePattern } = checkCommandsStatics.integration;
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
  // Only a scope naming FILES stays in band. A handful of files cannot fill a worker pool, and
  // ts-jest's LanguageService is built once PER WORKER, so spreading four files over four workers
  // pays that construction four times to save nothing. Every other scope — a directory, a whole
  // package, the whole repo — takes the `--maxWorkers` budget from `checkCommandsStatics`.
  //
  // That branch is also the ONLY place `--detectOpenHandles` can do anything: jest collects handles
  // from the main thread and reports none from workers, which is why the flag implies `--runInBand`
  // and why passing it globally single-threaded the whole repo. Here it rides a branch that was
  // already serial, so leak detection costs no parallelism — and it matters most in this check,
  // where the tests spawn real processes, bind real ports and open real files.
  // Jest REFUSES both at once — "Both --runInBand and --maxWorkers were specified, only one is
  // allowed" — and answers with its usage banner and a non-zero exit, which ward reports as a
  // crash plus a DISCOVERY MISMATCH rather than anything naming the real cause. So the in-band
  // branch drops the budget the shared args carry.
  const inBandArgs = baseArgs.filter((arg) => !arg.startsWith('--maxWorkers'));
  // The ignore pattern rides ONLY this branch, and it is what keeps this check to integration
  // tests: `--findRelatedTests` replaces the `--testPathPatterns` value the shared args carry, so
  // without it a source file's UNIT tests run here too. See the statics entry for the measurement.
  const finalArgs = hasFiles
    ? [
        ...inBandArgs,
        '--runInBand',
        '--detectOpenHandles',
        '--testPathIgnorePatterns',
        relatedTestsIgnorePattern,
        '--findRelatedTests',
        ...fileEntries,
      ]
    : [...baseArgs];
  if (testNamePattern !== undefined) {
    finalArgs.push('--testNamePattern', testNamePattern);
  }
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  // `--detectOpenHandles` above only reports from the MAIN thread, so the worker branch would
  // otherwise report no leaks at all. `@dungeonmaster/testing`'s jest setup watches the timer
  // globals instead and appends findings here, which works in a worker. The two are deliberately
  // exclusive: on the in-band branch jest's own detection is richer — it sees sockets and child
  // processes too — and running both would report every leaked timer twice.
  const wantsTimerWatch = !finalArgs.includes('--detectOpenHandles');
  const handleReportPath = openHandleReportPathTransformer({
    tmpdir: osTmpdirAdapter(),
    checkType: 'integration',
    processId: process.pid,
  });

  // The jest configs ask for the `source` export condition through testEnvironmentOptions, which
  // only governs what the TEST environment resolves. The transform glue's own
  // `@dungeonmaster/shared` imports are resolved by NODE, outside that environment, so without this
  // the jest process itself reads `dist/` while the tests it runs read source — measured. Ward is
  // published, so the broker below withholds the flag wherever the barrel it names is not on disk;
  // see its header for what Node does with a matched condition pointing at a missing file.
  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: finalArgs,
    cwd,
    env: {
      ...(sourceConditionSupportedBroker({ cwd }) ? { NODE_OPTIONS: '--conditions=source' } : {}),
      ...(wantsTimerWatch
        ? { [openHandleReportStatics.env.pathVar]: String(handleReportPath) }
        : {}),
    },
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  // In file scope (--committed / --uncommitted / passthrough), jest's "no tests found" banner means none of the
  // changed files has a related integration test — a skip, not a failure. Full runs keep failing
  // so a genuinely missing-tests misconfiguration still surfaces.
  if (status === 'fail' && fileList.length > 0 && isNoTestsFoundGuard({ output: result.output })) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      discoveredCount,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no integration tests related to changed files',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  let testFailures: ReturnType<typeof jestJsonParseTransformer> = [];
  let resolvedStatus = status;
  let filesCount = 0;
  let numPassedTests = 0;
  const processedFiles: GitRelativePath[] = [];
  const fileTimings: FileTiming[] = [];
  const openHandles: OpenHandle[] = [];

  if (status === 'fail') {
    try {
      testFailures = jestJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      resolvedStatus = 'fail';
      testFailures = [];
    }
  }

  const passingTests = jestJsonParsePassingTransformer({ jsonOutput: result.output });

  try {
    const jsonSlice = extractJsonObjectTransformer({ output: result.output });
    const parsed = jestJsonReportContract.parse(JSON.parse(jsonSlice));
    if (parsed.numTotalTestSuites !== undefined) {
      filesCount = Number(parsed.numTotalTestSuites);
    }
    if (parsed.numPassedTests !== undefined) {
      numPassedTests = Number(parsed.numPassedTests);
    }
    if (parsed.testResults !== undefined) {
      for (const tr of parsed.testResults) {
        const { name } = tr;
        if (name !== undefined && String(name).length > 0) {
          processedFiles.push(gitRelativePathContract.parse(String(name)));
          const { startTime } = tr;
          const { endTime } = tr;
          if (startTime !== undefined && endTime !== undefined) {
            fileTimings.push(
              fileTimingContract.parse({
                filePath: gitRelativePathContract.parse(String(name)),
                durationMs: Number(endTime) - Number(startTime),
                testMs: (tr.assertionResults ?? []).reduce(
                  (sum, assertion) => sum + Number(assertion.duration ?? 0),
                  0,
                ),
                // The gate reads THIS, not the sum above — see fileTimingContract for why a sum
                // grades a file on how many tests it holds.
                slowestTestMs: (tr.assertionResults ?? []).reduce(
                  (worst, assertion) => Math.max(worst, Number(assertion.duration ?? 0)),
                  0,
                ),
                testCount: (tr.assertionResults ?? []).length,
              }),
            );
          }
        }
      }
    }
    for (const handle of parsed.openHandles ?? []) {
      openHandles.push(
        openHandleContract.parse({
          name: String(handle.name ?? 'Error'),
          message: String(handle.message ?? ''),
          stack: String(handle.stack ?? ''),
        }),
      );
    }

    // LAST in this block on purpose. A half-written line makes `JSON.parse` throw, and everything
    // above is already assigned by then, so a mangled report costs the leak findings and nothing
    // else. The file exists only when a suite actually left a timer armed.
    if (wantsTimerWatch && fsExistsSyncAdapter({ filePath: handleReportPath })) {
      const reportContent = await fsReadFileAdapter({ filePath: handleReportPath });
      await fsUnlinkAdapter({ filePath: handleReportPath });
      openHandles.push(...openHandleReportParseTransformer({ content: String(reportContent) }));
    }
  } catch {
    // non-JSON output, filesCount stays 0
  }

  // One package holding no test by that name is a skip, not an error — only the run as a whole can
  // tell that apart from a typo, so record the outcome and let commandRunBroker judge it across
  // every package the pattern reached.
  const testNamePatternMatch =
    testNamePattern === undefined
      ? undefined
      : resolvedStatus === 'pass' && numPassedTests === 0
        ? 'unmatched'
        : 'matched';

  if (testNamePatternMatch === 'unmatched') {
    resolvedStatus = 'skip';
  }

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  return projectResultContract.parse({
    projectFolder,
    status: resolvedStatus,
    ...(testNamePatternMatch === undefined ? {} : { testNamePatternMatch }),
    errors: [],
    testFailures,
    filesCount,
    discoveredCount,
    onlyDiscovered,
    onlyProcessed,
    fileTimings,
    passingTests,
    openHandles,
    rawOutput: rawOutputContract.parse({
      stdout: result.output,
      stderr: '',
      exitCode,
      signal: result.signal,
    }),
  });
};
