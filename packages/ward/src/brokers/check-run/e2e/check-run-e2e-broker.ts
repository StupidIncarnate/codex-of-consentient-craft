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

import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { extractJsonObjectTransformer } from '../../../transformers/extract-json-object/extract-json-object-transformer';
import { playwrightJsonParseTransformer } from '../../../transformers/playwright-json-parse/playwright-json-parse-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
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
  const finalArgs =
    testNamePattern === undefined
      ? [...args, ...fileList]
      : [...args, '--grep', testNamePattern, ...fileList];
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

  let testFailures: ReturnType<typeof playwrightJsonParseTransformer> = [];

  if (status === 'fail') {
    try {
      testFailures = playwrightJsonParseTransformer({ jsonOutput: result.output });
    } catch {
      testFailures = [];
    }
  }

  let filesCount = 0;
  const processedFiles: GitRelativePath[] = [];
  const infrastructureErrors: ErrorEntry[] = [];

  try {
    const jsonSlice = extractJsonObjectTransformer({ output: result.output });
    const parsed: unknown = JSON.parse(jsonSlice);
    if (typeof parsed === 'object' && parsed !== null) {
      if ('suites' in parsed) {
        const suites: unknown = Reflect.get(parsed, 'suites');
        if (Array.isArray(suites)) {
          filesCount = suites.length;
          for (const suite of suites) {
            if (typeof suite === 'object' && suite !== null && 'title' in suite) {
              const title: unknown = Reflect.get(suite, 'title');
              if (typeof title === 'string' && title.length > 0) {
                processedFiles.push(gitRelativePathContract.parse(title));
              }
            }
          }
        }
      }

      if ('errors' in parsed) {
        const pwErrors: unknown = Reflect.get(parsed, 'errors');
        if (Array.isArray(pwErrors)) {
          for (const entry of pwErrors) {
            if (typeof entry !== 'object' || entry === null || !('message' in entry)) {
              continue;
            }
            const msg: unknown = Reflect.get(entry, 'message');
            if (typeof msg !== 'string' || msg.length === 0) {
              continue;
            }
            infrastructureErrors.push(
              errorEntryContract.parse({
                filePath: 'playwright.config.ts',
                line: 0,
                column: 0,
                message: errorMessageContract.parse(msg),
                severity: 'error',
              }),
            );
          }
        }
      }
    }
  } catch {
    const MAX_CRASH_MESSAGE_LENGTH = 2_000;
    if (status === 'fail' && result.output.length > 0) {
      infrastructureErrors.push(
        errorEntryContract.parse({
          filePath: 'playwright.config.ts',
          line: 0,
          column: 0,
          message: errorMessageContract.parse(result.output.slice(0, MAX_CRASH_MESSAGE_LENGTH)),
          severity: 'error',
        }),
      );
    }
  }

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  return projectResultContract.parse({
    projectFolder,
    status,
    errors: infrastructureErrors,
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
