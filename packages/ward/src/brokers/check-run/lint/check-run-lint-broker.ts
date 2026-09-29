/**
 * PURPOSE: Runs ESLint on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunLintBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed ESLint errors
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import {
  absoluteFilePathContract,
  errorMessageContract,
  exitCodeContract,
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
import type { FileTiming } from '../../../contracts/file-timing/file-timing-contract';
import { eslintJsonParseTransformer } from '../../../transformers/eslint-json-parse/eslint-json-parse-transformer';
import { eslintStatsParseTransformer } from '../../../transformers/eslint-stats-parse/eslint-stats-parse-transformer';
import { eslintStatsStripTransformer } from '../../../transformers/eslint-stats-strip/eslint-stats-strip-transformer';
import { extractJsonArrayTransformer } from '../../../transformers/extract-json-array/extract-json-array-transformer';
import { eslintIgnoredPatternExtractTransformer } from '../../../transformers/eslint-ignored-pattern-extract/eslint-ignored-pattern-extract-transformer';
import { isEslintIgnoredResultGuard } from '../../../guards/is-eslint-ignored-result/is-eslint-ignored-result-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';

export const checkRunLintBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
  testNamePattern?: string;
}): Promise<ProjectResult> => {
  const { bin, args } = checkCommandsStatics.lint;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const finalArgs = fileList.length > 0 ? [...args.slice(0, -1), ...fileList] : [...args];
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  // A missing `eslint` binary rejects `run` with RunNotFoundError rather than resolving a result —
  // caught here and folded into the same failed-run shape the old spawn-capture adapter resolved
  // for an ENOENT, so a machine without the resolved bin reads as a failing lint run below, exactly
  // as it always has.
  const result = await run({ command, args: finalArgs, cwd }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  const exitCode = exitCodeContract.parse(result.exitCode);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  // A scoped path holding no lintable file (a JSON fixture folder) aborts ESLint for the WHOLE run, real
  // files included. Only the exact sentence naming a path this run passed counts: that path is dropped
  // and the rest lints again, and a scope left with nothing is a skip, the way a scoped jest run with
  // no tests is. Every other failure, and every unscoped run, falls through untouched.
  const unlintablePattern =
    status === 'fail' && fileList.length > 0
      ? eslintIgnoredPatternExtractTransformer({ output: result.output })
      : undefined;
  const remainingFiles = fileList.filter((file) => file !== unlintablePattern);

  if (unlintablePattern !== undefined && remainingFiles.length < fileList.length) {
    if (remainingFiles.length > 0) {
      return checkRunLintBroker({ projectFolder, fileList: remainingFiles });
    }
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      discoveredCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no lintable files in scope',
        exitCode,
        signal: result.signal,
      }),
    });
  }

  let errors: ReturnType<typeof eslintJsonParseTransformer> = [];
  let resolvedStatus = status;
  let filesCount = 0;
  let fileTimings: FileTiming[] = [];

  if (status === 'fail') {
    try {
      errors = eslintJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      resolvedStatus = 'fail';
      errors = [];
    }
  }

  try {
    const jsonSlice = extractJsonArrayTransformer({
      output: errorMessageContract.parse(result.output),
    });
    const parsed: unknown = JSON.parse(jsonSlice);
    if (Array.isArray(parsed)) {
      // AN IGNORED PATH IS NOT A LINTED FILE. ESLint replies with a full result entry for an
      // explicitly-passed path its config ignores, so the raw array length counted files it never
      // opened — and a scope made entirely of them reported `1 files passed` at exit 0.
      const linted = parsed.filter((entry) => !isEslintIgnoredResultGuard({ entry }));
      filesCount = linted.length;
      fileTimings = eslintStatsParseTransformer({ eslintResults: linted });
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
    discoveredCount: filesCount,
    fileTimings,
    rawOutput: rawOutputContract.parse({
      // The timing tree is read into `fileTimings` above and dropped here: it was 88% of a saved
      // whole-repo lint run, and `ward raw lint` needs only the messages.
      stdout: eslintStatsStripTransformer({ output: errorMessageContract.parse(result.output) }),
      stderr: '',
      exitCode,
      signal: result.signal,
    }),
  });
};
