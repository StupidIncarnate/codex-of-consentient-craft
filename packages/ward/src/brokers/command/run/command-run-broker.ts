/**
 * PURPOSE: Executes a full ward run and prints a summary to stdout, exiting with appropriate code
 *
 * USAGE:
 * await commandRunBroker({ config: WardConfigStub(), rootPath: AbsoluteFilePathStub() });
 * // Runs all checks, prints summary, exits 0 on pass or 1 on failure
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { ProjectResult } from '../../../contracts/project-result/project-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { commandRunLayerFolderBroker } from './command-run-layer-folder-broker';
import { commandRunLayerSingleBroker } from './command-run-layer-single-broker';
import { commandRunLayerMultiBroker } from './command-run-layer-multi-broker';
import { resultToSummaryTransformer } from '../../../transformers/result-to-summary/result-to-summary-transformer';
import { gitDiffFilesBroker } from '../../git/diff-files/git-diff-files-broker';
import { isSourceFileGuard } from '../../../guards/is-source-file/is-source-file-guard';
import { isProjectReferencesModeGuard } from '../../../guards/is-project-references-mode/is-project-references-mode-guard';
import { hasCheckDiscoveryMismatchGuard } from '../../../guards/has-check-discovery-mismatch/has-check-discovery-mismatch-guard';
import { projectReferencesSyncBroker } from '../../project-references/sync/project-references-sync-broker';
import { checkRunTypecheckRefsBroker } from '../../check-run/typecheck-refs/check-run-typecheck-refs-broker';

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

  const checkTypes = resolvedConfig.only ?? [...allCheckTypesStatics];
  const wantsTypecheck = checkTypes.includes('typecheck');

  const preComputedTypecheck: Map<ProjectFolder['path'], ProjectResult> | undefined =
    workspaces !== null && wantsTypecheck
      ? await (async (): Promise<Map<ProjectFolder['path'], ProjectResult> | undefined> => {
          const syncResult = await projectReferencesSyncBroker({
            rootPath,
            projectFolders: workspaces,
          });

          if (syncResult.status === 'cycle') {
            const cycleStr = syncResult.cycle?.join(' -> ') ?? '';
            process.stderr.write(
              `\nWARNING: project references cycle detected (${cycleStr}). Falling back to per-package typecheck.\n`,
            );
            return undefined;
          }

          if (
            !isProjectReferencesModeGuard({
              rootHasWorkspaces: true,
              eligibleWorkspaceCount: Number(syncResult.eligibleCount),
            })
          ) {
            return undefined;
          }

          if (syncResult.status === 'synced') {
            process.stderr.write(
              `ward: synced project references in ${String(syncResult.writtenPaths.length)} tsconfig(s)\n`,
            );
          }

          const eligibleSet = new Set(syncResult.eligibleProjectPaths.map(String));
          const eligibleFolders = workspaces.filter((folder) =>
            eligibleSet.has(String(folder.path)),
          );

          return checkRunTypecheckRefsBroker({
            rootPath,
            projectFolders: eligibleFolders,
          });
        })()
      : undefined;

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
          ...(preComputedTypecheck === undefined ? {} : { preComputedTypecheck }),
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
