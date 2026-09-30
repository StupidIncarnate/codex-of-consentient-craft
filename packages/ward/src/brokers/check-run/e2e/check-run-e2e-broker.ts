/**
 * PURPOSE: Runs Playwright E2E tests on a project folder and parses the line output into a ProjectResult
 *
 * USAGE:
 * const result = await checkRunE2eBroker({ projectFolder: ProjectFolderStub(), fileList: [] });
 * // Returns ProjectResult with parsed Playwright test failures, skip if the package is not
 * // e2e-eligible, or fail if it's eligible but missing playwright.config.ts
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import { existsSync } from '#gateway/node/fs';
import { readFile, unlink } from '#gateway/node/fs__promises';
import { freePortPair } from '#gateway/node/net';
import {
  architecturePackageE2eEligibleDetectBroker,
  portKillListenersBroker,
} from '@dungeonmaster/shared/brokers';

import { rawOutputContract } from '../../../contracts/raw-output/raw-output-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';

import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { extractPlaywrightLineFilesTransformer } from '../../../transformers/extract-playwright-line-files/extract-playwright-line-files-transformer';
import { parsePlaywrightCrashOutputTransformer } from '../../../transformers/parse-playwright-crash-output/parse-playwright-crash-output-transformer';
import { playwrightJsonReportToPassingTransformer } from '../../../transformers/playwright-json-report-to-passing/playwright-json-report-to-passing-transformer';
import { passingTestsToTimingsTransformer } from '../../../transformers/passing-tests-to-timings/passing-tests-to-timings-transformer';
import { openHandleReportParseTransformer } from '../../../transformers/open-handle-report-parse/open-handle-report-parse-transformer';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';
import { openHandleReportStatics } from '../../../statics/open-handle-report/open-handle-report-statics';
import { tmpdirFindBroker } from '../../tmpdir/find/tmpdir-find-broker';
import type { OpenHandle } from '../../../contracts/open-handle/open-handle-contract';
import { discoveryDiffTransformer } from '../../../transformers/discovery-diff/discovery-diff-transformer';
import { isE2eTestPathGuard } from '../../../guards/is-e2e-test-path/is-e2e-test-path-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { bundleBuildBroker } from '../../bundle/build/bundle-build-broker';
import { e2eArtifactsRemoveBroker } from '../../e2e-artifacts/remove/e2e-artifacts-remove-broker';
import { sourceConditionSupportedBroker } from '../../source-condition/supported/source-condition-supported-broker';
import { globDiscoverFilesBroker } from '../../glob/discover-files/glob-discover-files-broker';

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

  // --pass-with-no-tests keeps a --grep that matches nothing here from exiting non-zero on its own:
  // whether the pattern matching nothing is a real failure depends on the other packages in the
  // run, which only commandRunBroker can see.
  const finalArgs =
    testNamePattern === undefined
      ? [...args, ...e2eFiles]
      : [...args, '--grep', testNamePattern, '--pass-with-no-tests', ...e2eFiles];
  const command = binResolveBroker({ binName: bin, cwd });

  // The prebuilt UI bundle `vite preview` serves, keyed by a hash of every source in this package's
  // `dependencies` closure — so a run whose inputs have not changed reuses the build instead of
  // paying a dev server's startup and per-request transform for the whole suite.
  //
  // The Playwright process (runner and worker, which import the harnesses) gets `--conditions=source`
  // below, like ward's jest children, so `@dungeonmaster/shared` and `@dungeonmaster/testing` resolve
  // to TypeScript there and a stub or proxy `dist/` does not ship is still reachable. The servers
  // under test do not keep it: `packages/web/playwright.config.ts` strips it from their env, because
  // Vite loads its config through plain Node and that condition sends it to `.ts` barrels.
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

  // Both ports come from their own bound socket, held open together. Do NOT simplify this to
  // `serverPort + 1`: nothing checks that a derived port is free, a concurrent run can be handed
  // it as ITS server port, and the portKillListenersBroker teardown below then kills that run's
  // server mid-suite — which reads as an unrelated flaky spec rather than as a port collision.
  const { firstPort: serverPort, secondPort: webPort } = await freePortPair();

  // The port makes this path unique per run, which is what lets two browser walks run against one
  // package at once. A name fixed per package has the second run overwriting a report the first is
  // still reading, and both sub-agents then read a run describing neither.
  const jsonReportPath = `${projectFolder.path}/.ward-playwright-report-${String(serverPort)}.json`;

  // Playwright is a THIRD process layer with its own leak surface, and neither of ward's other two
  // detections reaches it: jest's `--detectOpenHandles` never runs here, and the timer watch ward
  // arms for a jest worker is armed in a jest worker. The web package's e2e fixtures answer this
  // variable and append per test. Named by the SERVER PORT, like the report beside it, so two
  // browser walks against one package cannot overwrite each other's findings.
  const handleReportPath = openHandleReportPathTransformer({
    tmpdir: tmpdirFindBroker(),
    checkType: 'e2e',
    processId: serverPort,
  });

  // A missing `playwright` binary rejects `run` with RunNotFoundError rather than resolving a
  // result — caught here and folded into the same failed-run shape the old spawn-capture adapter
  // resolved for an ENOENT, so a machine without the resolved bin reads as a failing e2e run below,
  // exactly as it always has.
  const result = await run({
    command,
    args: finalArgs,
    cwd,
    env: {
      [openHandleReportStatics.env.pathVar]: handleReportPath,
      DUNGEONMASTER_PORT: String(serverPort),
      DUNGEONMASTER_WEB_PORT: String(webPort),
      PLAYWRIGHT_JSON_OUTPUT_NAME: jsonReportPath,
      ...(sourceConditionSupportedBroker({ cwd }) ? { NODE_OPTIONS: '--conditions=source' } : {}),
      // Absent when the package has no build script to make a bundle with. The consumer's
      // playwright config decides what to serve then; ward states what it has rather than
      // pointing at a directory it never built.
      ...(bundle.bundleDir === null
        ? {}
        : { DUNGEONMASTER_WEB_BUNDLE_DIR: String(bundle.bundleDir) }),
    },
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  await Promise.all([
    portKillListenersBroker({ port: serverPort }),
    portKillListenersBroker({ port: webPort }),
  ]);

  const { exitCode } = result;
  const status = exitCode === 0 ? 'pass' : 'fail';

  let testFailures: ReturnType<typeof parsePlaywrightCrashOutputTransformer> = [];

  if (status === 'fail' && result.output.length > 0) {
    try {
      testFailures = parsePlaywrightCrashOutputTransformer({
        output: result.output,
      });
    } catch {
      testFailures = [];
    }
  }

  const passingTests = await (async (): Promise<
    ReturnType<typeof playwrightJsonReportToPassingTransformer>
  > => {
    try {
      const jsonContent = await readFile(jsonReportPath);
      return playwrightJsonReportToPassingTransformer({ jsonContent });
    } catch {
      return [];
    }
  })();

  try {
    await unlink(jsonReportPath);
  } catch {
    // report file may not exist if playwright crashed early; ignore
  }

  // The file exists only when a spec actually left a timer armed.
  const openHandles = await (async (): Promise<OpenHandle[]> => {
    if (!existsSync(handleReportPath)) {
      return [];
    }
    try {
      const content = await readFile(handleReportPath);
      await unlink(handleReportPath);
      return openHandleReportParseTransformer({ content });
    } catch {
      // A half-written line makes JSON.parse throw. Losing the leak findings is a far better
      // outcome than losing the whole e2e result to a parse error.
      return [];
    }
  })();

  // The Vite dependency cache this run minted under its own port. It has to be taken HERE, above
  // the testNamePattern early return below: that return is a common path — `--onlyTests` matching
  // nothing is normal in most packages — and cleanup placed at the end of the function would leak
  // a full cache on every one of those runs. It also has to be after the port kill above, since
  // the process that wrote the directory is still holding a port until then.
  await e2eArtifactsRemoveBroker({ packageRoot, port: serverPort });

  const processedFiles: string[] = [];
  const lineFiles =
    result.output.length > 0
      ? extractPlaywrightLineFilesTransformer({ output: result.output })
      : [];
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
        stdout: result.output,
        stderr: '',
        exitCode,
        signal: result.signal,
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
      stdout: result.output,
      stderr: '',
      exitCode,
      signal: result.signal,
    }),
  });
};
