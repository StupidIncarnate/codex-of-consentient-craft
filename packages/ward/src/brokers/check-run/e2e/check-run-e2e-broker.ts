/**
 * PURPOSE: Runs Playwright E2E tests on a project folder and parses the line output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunE2eBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Playwright test failures, skip if the package is not
 * // e2e-eligible, or fail if it's eligible but missing playwright.config.ts
 */

import { existsSync } from '#gateway/node/fs';
import { architecturePackageE2eEligibleDetectBroker } from '@dungeonmaster/shared/brokers';
import { configResolveBroker } from '@dungeonmaster/config';

import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import type { E2eShardOutput } from '../../../contracts/e2e-shard-output/e2e-shard-output-contract';

import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { e2eShardStatics } from '../../../statics/e2e-shard/e2e-shard-statics';
import { e2eShardCountTransformer } from '../../../transformers/e2e-shard-count/e2e-shard-count-transformer';
import { e2eShardOutputsMergeTransformer } from '../../../transformers/e2e-shard-outputs-merge/e2e-shard-outputs-merge-transformer';
import { extractPlaywrightLineFilesTransformer } from '../../../transformers/extract-playwright-line-files/extract-playwright-line-files-transformer';
import { parsePlaywrightCrashOutputTransformer } from '../../../transformers/parse-playwright-crash-output/parse-playwright-crash-output-transformer';
import { passingTestsToTimingsTransformer } from '../../../transformers/passing-tests-to-timings/passing-tests-to-timings-transformer';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { isE2eTestPathGuard } from '../../../guards/is-e2e-test-path/is-e2e-test-path-guard';
import { bundleBuildBroker } from '../../bundle/build/bundle-build-broker';
import { runnerCommandResolveBroker } from '../../runner-command/resolve/runner-command-resolve-broker';
import { globDiscoverFilesBroker } from '../../glob/discover-files/glob-discover-files-broker';
import { runShardLayerBroker } from './run-shard-layer-broker';

export const checkRunE2eBroker = async ({
  projectFolder,
  fileList,
  testNamePattern,
}: {
  projectFolder: ProjectFolder;
  fileList: string[];
  testNamePattern?: string;
}): Promise<ProjectResult> => {
  const packageRoot = projectFolder.path;
  const e2eEligible = await architecturePackageE2eEligibleDetectBroker({ packageRoot });

  if (!e2eEligible) {
    // Not a frontend-react/frontend-ink package — no Playwright suite is expected here, so a
    // missing (or even present) playwright.config.ts is not this broker's concern.
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      ...(testNamePattern === undefined ? {} : { testNamePatternMatch: 'unmatched' as const }),
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'not e2e-eligible (packageType is not frontend-react or frontend-ink)',
        exitCode: 0,
      }),
    });
  }

  const configPath = `${projectFolder.path}/playwright.config.ts`;
  if (!existsSync(configPath)) {
    // Eligible per its own widgets/react (or ink) signals but missing the config Playwright needs
    // to run — a real gap, not something to skip quietly.
    return projectResultContract.parse({
      projectFolder,
      status: 'fail',
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'e2e-eligible package is missing playwright.config.ts',
        exitCode: 1,
      }),
    });
  }

  const { bin, args, discoverPatterns } = checkCommandsStatics.e2e;
  const cwd = projectFolder.path;
  const { discoveredCount, discoveredFiles } = globDiscoverFilesBroker({
    patterns: discoverPatterns,
    cwd,
  });

  const e2eFiles = fileList.filter((f) => isE2eTestPathGuard({ filePath: f }));

  if (fileList.length > 0 && e2eFiles.length === 0) {
    // Scope (changed/passthrough) holds no e2e files, so nothing was in scope to
    // discover. Report discoveredCount 0 — a nonzero count here would trip the
    // discovery-mismatch detector even though skipping is the correct behavior.
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      ...(testNamePattern === undefined ? {} : { testNamePatternMatch: 'unmatched' as const }),
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: 'no matching e2e test files in passthrough',
        exitCode: 0,
      }),
    });
  }

  const config = await configResolveBroker({
    filePath: `${projectFolder.path}/package.json`,
  });
  const shardingEnabled = config.ward?.e2eSharding ?? false;
  const specFileCount = fileList.length > 0 ? e2eFiles.length : discoveredCount;
  const shardCount = e2eShardCountTransformer({
    shardingEnabled,
    requested: e2eShardStatics.defaultCount,
    specFileCount,
    testNamePattern,
  });

  // --pass-with-no-tests keeps a --grep that matches nothing here from exiting non-zero on its own:
  // whether the pattern matching nothing is a real failure depends on the other packages in the
  // run, which only commandRunBroker can see.
  const finalArgs =
    testNamePattern === undefined
      ? [...args, ...e2eFiles]
      : [...args, '--grep', testNamePattern, '--pass-with-no-tests', ...e2eFiles];
  const runner = runnerCommandResolveBroker({ binName: bin, cwd });

  // The prebuilt UI bundle `vite preview` serves, keyed by a hash of every source in this package's
  // `dependencies` closure — so a run whose inputs have not changed reuses the build instead of
  // paying a dev server's startup and per-request transform for the whole suite.
  //
  // The Playwright processes (the CLI, its runner and its workers, which import the harnesses) get
  // `--conditions=source` through the runner command, like ward's jest children, so
  // `@dungeonmaster/shared` and `@dungeonmaster/testing` resolve to TypeScript there and a stub or
  // proxy `dist/` does not ship is still reachable. The servers under test and any program a global
  // setup or a harness spawns do not inherit it — see runnerCommandResolveBroker.
  const bundle = await bundleBuildBroker({ packageRoot });

  if (bundle.error !== null) {
    // No bundle means nothing for `vite preview` to serve, so every spec would fail on a page that
    // never loads. Reporting the build output here is what names the actual cause.
    return projectResultContract.parse({
      projectFolder,
      status: 'fail',
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: '',
        stderr: String(bundle.error),
        exitCode: 1,
      }),
    });
  }

  const shardPromises: Promise<E2eShardOutput>[] = [];
  for (let shardIndex = 1; shardIndex <= shardCount; shardIndex++) {
    shardPromises.push(
      runShardLayerBroker({
        projectFolder,
        runner,
        finalArgs,
        bundleDir: bundle.bundleDir,
        shardIndex,
        shardCount,
      }),
    );
  }
  const shardOutputs = await Promise.all(shardPromises);
  const merged = e2eShardOutputsMergeTransformer({ shardOutputs });

  const { exitCode, signal, output, passingTests, openHandles } = merged;
  const status = exitCode === 0 ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof parsePlaywrightCrashOutputTransformer> = [];

  if (status === 'fail' && output.length > 0) {
    try {
      testFailures = parsePlaywrightCrashOutputTransformer({
        output,
      });
    } catch {
      testFailures = [];
    }
  }

  const processedFiles: string[] = [];
  const lineFiles = output.length > 0 ? extractPlaywrightLineFilesTransformer({ output }) : [];
  for (const file of lineFiles) {
    processedFiles.push(file);
  }
  const filesCount = lineFiles.length;

  if (testNamePattern !== undefined && status === 'pass' && filesCount === 0) {
    // No spec in this package carries a name the pattern matches. Report discoveredCount 0 with the
    // skip: a nonzero count here would trip the discovery-mismatch detector even though skipping is
    // the correct behavior.
    return projectResultContract.parse({
      projectFolder,
      status: 'skip',
      testNamePatternMatch: 'unmatched',
      errors: [],
      testFailures: [],
      filesCount: 0,
      rawOutput: rawOutputContract.parse({
        stdout: output,
        stderr: '',
        exitCode,
        signal,
      }),
    });
  }

  const { onlyDiscovered, onlyProcessed } = discoveryDiffTransformer({
    discoveredFiles,
    processedFiles,
    cwd,
  });

  return projectResultContract.parse({
    projectFolder,
    status,
    ...(testNamePattern === undefined ? {} : { testNamePatternMatch: 'matched' }),
    errors: [],
    testFailures,
    filesCount,
    discoveredCount,
    onlyDiscovered,
    onlyProcessed,
    passingTests,
    // Playwright reports per TEST; ward's slow-file list and its slow-file verdict both work in
    // suites, so the durations are rolled up here. Without this the e2e check reports no timings at
    // all and `hasSlowFilesGuard` is blind to every browser spec in the repo.
    fileTimings: passingTestsToTimingsTransformer({ passingTests }),
    openHandles,
    rawOutput: rawOutputContract.parse({
      stdout: output,
      stderr: '',
      exitCode,
      signal,
    }),
  });
};
