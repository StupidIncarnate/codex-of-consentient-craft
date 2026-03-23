/**
 * PURPOSE: Runs Playwright E2E tests on a project folder and parses the line output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunE2eBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Playwright test failures, or skip if no playwright.config.ts
 */

import {
  childProcessSpawnCaptureAdapter,
  fsExistsSyncAdapter,
  netFreePortAdapter,
} from '@dungeonmaster/shared/adapters';

import { netKillPortAdapter } from '../../../adapters/net/kill-port/net-kill-port-adapter';
import {
  absoluteFilePathContract,
  errorMessageContract,
  exitCodeContract,
  filePathContract,
  networkPortContract,
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
import { extractPlaywrightLineFilesTransformer } from '../../../transformers/extract-playwright-line-files/extract-playwright-line-files-transformer';
import { parsePlaywrightCrashOutputTransformer } from '../../../transformers/parse-playwright-crash-output/parse-playwright-crash-output-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { isE2eTestPathGuard } from '../../../guards/is-e2e-test-path/is-e2e-test-path-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';

export const checkRunE2eBroker = async ({
  projectFolder,
  fileList,
  testNamePattern,
}: {
  projectFolder: ProjectFolder;
  fileList: GitRelativePath[];
  testNamePattern?: string;
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

  const { bin, args, discoverPatterns } = checkCommandsStatics.e2e;
  const cwd = absoluteFilePathContract.parse(projectFolder.path);
  const { discoveredCount, discoveredFiles } = fsGlobSyncAdapter({
    patterns: discoverPatterns,
    cwd,
  });

  const e2eFiles = fileList.filter((f) => isE2eTestPathGuard({ filePath: String(f) }));

  if (fileList.length > 0 && e2eFiles.length === 0) {
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      errors: [],
      testFailures: [],
      filesCount: 0,
      discoveredCount,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no matching e2e test files in passthrough',
        exitCode: exitCodeContract.parse(0),
      }),
    });
  }

  const finalArgs =
    testNamePattern === undefined
      ? [...args, ...e2eFiles]
      : [...args, '--grep', testNamePattern, ...e2eFiles];
  const command = String(binResolveBroker({ binName: binCommandContract.parse(bin), cwd }));

  const serverPort = await netFreePortAdapter();
  const webPort = networkPortContract.parse(serverPort + 1);

  const FIVE_MINUTES = 300_000;
  const result = await childProcessSpawnCaptureAdapter({
    command,
    args: finalArgs,
    cwd,
    timeout: FIVE_MINUTES,
    env: {
      DUNGEONMASTER_PORT: String(serverPort),
      DUNGEONMASTER_WEB_PORT: String(webPort),
    },
  });

  await Promise.all([
    netKillPortAdapter({ port: serverPort }),
    netKillPortAdapter({ port: webPort }),
  ]);

  const exitCode = result.exitCode ?? exitCodeContract.parse(1);
  const status = exitCode === exitCodeContract.parse(0) ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof parsePlaywrightCrashOutputTransformer> = [];

  if (status === 'fail' && result.output.length > 0) {
    try {
      testFailures = parsePlaywrightCrashOutputTransformer({
        output: errorMessageContract.parse(result.output),
      });
    } catch {
      testFailures = [];
    }
  }

  const processedFiles: GitRelativePath[] = [];
  const lineFiles =
    result.output.length > 0
      ? extractPlaywrightLineFilesTransformer({ output: result.output })
      : [];
  for (const file of lineFiles) {
    processedFiles.push(file);
  }
  const filesCount = lineFiles.length;

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  return projectResultContract.parse({
    projectFolder,
    status,
    errors: [],
    testFailures,
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
