/**
 * PURPOSE: Executes a full ward run and prints a summary to stdout, exiting with appropriate code
 *
 * USAGE:
 * await commandRunBroker({ config: WardConfigStub(), rootPath: AbsoluteFilePathStub() });
 * // Runs all checks, prints summary, exits 0 on pass or 1 on failure
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { commandRunLayerFolderBroker } from './command-run-layer-folder-broker';
import { commandRunLayerSingleBroker } from './command-run-layer-single-broker';
import { commandRunLayerMultiBroker } from './command-run-layer-multi-broker';
import { resultToSummaryTransformer } from '../../../transformers/result-to-summary/result-to-summary-transformer';
import { gitDiffFilesBroker } from '../../git/diff-files/git-diff-files-broker';
import { isSourceFileGuard } from '../../../guards/is-source-file/is-source-file-guard';
import { hasCheckDiscoveryMismatchGuard } from '../../../guards/has-check-discovery-mismatch/has-check-discovery-mismatch-guard';

export const commandRunBroker = async ({
  config,
  rootPath,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const resolvedConfig = config.changed
    ? await (async (): Promise<WardConfig> => {
        const changedFiles = await gitDiffFilesBroker({ cwd: rootPath });
        const sourceFiles = changedFiles.filter((file) =>
          isSourceFileGuard({ filePath: String(file) }),
        );
        return {
          ...config,
          passthrough:
            sourceFiles.length > 0
              ? (sourceFiles.map(String) as WardConfig['passthrough'])
              : config.passthrough,
        };
      })()
    : config;

  const workspaces = await workspaceDiscoverBroker({ rootPath });

  const wardResult =
    workspaces === null
      ? await (async () => {
          const projectFolder = await commandRunLayerFolderBroker({ rootPath });
          return commandRunLayerSingleBroker({ config: resolvedConfig, projectFolder, rootPath });
        })()
      : await commandRunLayerMultiBroker({
          config: resolvedConfig,
          projectFolders: workspaces,
          rootPath,
        });

  process.stderr.write('\r\x1b[K\n');
  const summary = resultToSummaryTransformer({ wardResult, cwd: rootPath });

  process.stdout.write(`${summary}\n`);

  const hasFailing = wardResult.checks.some((check) => check.status === 'fail');

  const hasPassthrough =
    Array.isArray(wardResult.filters.passthrough) && wardResult.filters.passthrough.length > 0;
  const mismatchedChecks = wardResult.checks.filter((check) =>
    hasCheckDiscoveryMismatchGuard({ check, hasPassthrough }),
  );

  if (mismatchedChecks.length > 0) {
    const mismatchList = mismatchedChecks.map((check) => `  - ${check.checkType}`).join('\n');
    process.stdout.write(
      `\nDISCOVERY MISMATCH — ward discovered files that were not processed (or vice versa). Every test must run; an unrun test is a hidden regression. This run is FAILING until each mismatch below is investigated and resolved at the root cause:\n${mismatchList}\n\nFor each check above: read the "only processed" / "only discovered" lines in the summary, then determine WHY discovery and processing diverged (e.g. test runner config drift from ward's discovery globs, untyped imports pulling in dist files, files matching a pattern they shouldn't, missing config exclusions). Fix the root cause — do not paper over the mismatch by adjusting ward's discovery to match the buggy state.\n`,
    );
    process.exitCode = 1;
  }

  if (hasFailing) {
    process.stdout.write(
      `\nFull error details: npm run ward -- detail ${wardResult.runId} <filePath>\n`,
    );
    process.exitCode = 1;
  }
  return adapterResultContract.parse({ success: true });
};
