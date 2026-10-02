/**
 * PURPOSE: Runs a single Playwright e2e shard process with isolated ports and artifact cleanup
 *
 * USAGE:
 * const shardOutput = await runShardLayerBroker({
 *   projectFolder,
 *   runner,
 *   finalArgs,
 *   bundleDir,
 *   shardIndex: 1,
 *   shardCount: 3,
 * });
 * // Returns: E2eShardOutput
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import { existsSync } from '#gateway/node/fs';
import { readFile, unlink } from '#gateway/node/fs__promises';
import { freePortPair } from '#gateway/node/net';
import { portKillListenersBroker } from '@dungeonmaster/shared/brokers';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { RunnerCommand } from '../../../contracts/runner-command/runner-command-contract';
import {
  e2eShardOutputContract,
  type E2eShardOutput,
} from '../../../contracts/e2e-shard-output/e2e-shard-output-contract';
import type { OpenHandle } from '../../../contracts/open-handle/open-handle-contract';

import { playwrightJsonReportToPassingTransformer } from '../../../transformers/playwright-json-report-to-passing/playwright-json-report-to-passing-transformer';
import { openHandleReportParseTransformer } from '../../../transformers/open-handle-report-parse/open-handle-report-parse-transformer';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';
import { openHandleReportStatics } from '../../../statics/open-handle-report/open-handle-report-statics';
import { tmpdirFindBroker } from '../../tmpdir/find/tmpdir-find-broker';
import { e2eArtifactsRemoveBroker } from '../../e2e-artifacts/remove/e2e-artifacts-remove-broker';

export const runShardLayerBroker = async ({
  projectFolder,
  runner,
  finalArgs,
  bundleDir,
  shardIndex,
  shardCount,
}: {
  projectFolder: ProjectFolder;
  runner: RunnerCommand;
  finalArgs: string[];
  bundleDir: string | null;
  shardIndex: number;
  shardCount: number;
}): Promise<E2eShardOutput> => {
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

  const shardArgs =
    shardCount > 1 ? [`--shard=${shardIndex}/${shardCount}`, '--pass-with-no-tests'] : [];

  // A missing `playwright` binary rejects `run` with RunNotFoundError rather than resolving a
  // result — caught here and folded into the same failed-run shape the old spawn-capture adapter
  // resolved for an ENOENT, so a machine without the resolved bin reads as a failing e2e run below,
  // exactly as it always has.
  const result = await run({
    command: runner.command,
    args: [...runner.leadingArgs, ...finalArgs, ...shardArgs],
    cwd: projectFolder.path,
    env: {
      [openHandleReportStatics.env.pathVar]: handleReportPath,
      DUNGEONMASTER_PORT: String(serverPort),
      DUNGEONMASTER_WEB_PORT: String(webPort),
      PLAYWRIGHT_JSON_OUTPUT_NAME: jsonReportPath,
      // Absent when the package has no build script to make a bundle with. The consumer's
      // playwright config decides what to serve then; ward states what it has rather than
      // pointing at a directory it never built.
      ...(bundleDir === null ? {} : { DUNGEONMASTER_WEB_BUNDLE_DIR: bundleDir }),
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
  await e2eArtifactsRemoveBroker({ packageRoot: projectFolder.path, port: serverPort });

  return e2eShardOutputContract.parse({
    shardIndex,
    shardCount,
    output: result.output,
    exitCode: result.exitCode,
    signal: result.signal,
    passingTests,
    openHandles,
  });
};
