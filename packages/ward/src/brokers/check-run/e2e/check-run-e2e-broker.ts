/**
 * PURPOSE: Runs Playwright E2E tests on a project folder and parses the JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunE2eBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Playwright test failures, or skip if no playwright.config.ts
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

import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { extractJsonObjectTransformer } from '../../../transformers/extract-json-object/extract-json-object-transformer';
import { playwrightJsonParseTransformer } from '../../../transformers/playwright-json-parse/playwright-json-parse-transformer';

export const checkRunE2eBroker = async ({
  projectFolder,
  fileList,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
}): Promise<ProjectResult> => {
  const configPath = filePathContract.parse(`${projectFolder.path}/playwright.config.ts`);
  if (!fsExistsSyncAdapter({ filePath: configPath })) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no playwright.config.ts',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  const { command, args } = checkCommandsStatics.e2e;
  const finalArgs = fileList.length > 0 ? [...args, ...fileList] : [...args];
  const cwd = absoluteFilePathContract.parse(projectFolder.path);

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: finalArgs,
    cwd,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof playwrightJsonParseTransformer> = [];

  if (status === 'fail') {
    try {
      testFailures = playwrightJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      testFailures = [];
    }
  }

  let filesCount = 0;

  try {
    const jsonSlice = extractJsonObjectTransformer({ output: result.output });
    const parsed: unknown = JSON.parse(jsonSlice);
    if (typeof parsed === 'object' && parsed !== null && 'suites' in parsed) {
      const suites: unknown = Reflect.get(parsed, 'suites');
      if (Array.isArray(suites)) {
        filesCount = suites.length;
      }
    }
  } catch {
    // non-JSON output, filesCount stays 0
  }

  return projectResultContract.parse({
    projectFolder,
    status,
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
