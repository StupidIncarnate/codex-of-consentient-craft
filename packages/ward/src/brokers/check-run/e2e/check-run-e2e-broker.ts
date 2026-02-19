/**
 * PURPOSE: Runs Playwright e2e tests once from the project root and parses JSON output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunE2eBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns ProjectResult with parsed Playwright test failures
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import { projectFolderContract } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import { playwrightJsonParseTransformer } from '../../../transformers/playwright-json-parse/playwright-json-parse-transformer';

const e2eCommand = { command: 'npx', args: ['playwright', 'test', '--reporter', 'json'] } as const;

export const checkRunE2eBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<ProjectResult> => {
  const { command, args } = e2eCommand;

  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: [...args],
    cwd: rootPath,
  });

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof playwrightJsonParseTransformer> = [];
  let resolvedStatus = status;

  if (status === 'fail') {
    try {
      testFailures = playwrightJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      resolvedStatus = 'fail';
      testFailures = [];
    }
  }

  const projectFolder = projectFolderContract.parse({
    name: 'root',
    path: rootPath,
  });

  return projectResultContract.parse({
    projectFolder,
    status: resolvedStatus,
    errors: [],
    testFailures,
    rawOutput: rawOutputContract.parse({
      stdout: '',
      stderr: '',
      exitCode,
    }),
  });
};
