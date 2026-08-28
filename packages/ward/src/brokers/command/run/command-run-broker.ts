/**
 * PURPOSE: Executes a full ward run and prints a summary to stdout, exiting with appropriate code
 *
 * USAGE:
 * await commandRunBroker({ config: WardConfigStub(), rootPath: AbsoluteFilePathStub() });
 * // Runs all checks, prints summary, exits 0 on pass or 1 on failure
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { ProjectResult } from '../../../contracts/project-result/project-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { fileScopeEmptyStatics } from '../../../statics/file-scope-empty/file-scope-empty-statics';
import { noFilesProcessedStatics } from '../../../statics/no-files-processed/no-files-processed-statics';
import { pathNotFoundStatics } from '../../../statics/path-not-found/path-not-found-statics';
import { commandRunLayerPathCheckBroker } from './command-run-layer-path-check-broker';
import { hasNoFilesProcessedGuard } from '../../../guards/has-no-files-processed/has-no-files-processed-guard';
import { isCrashedProjectResultGuard } from '../../../guards/is-crashed-project-result/is-crashed-project-result-guard';
import { isExplicitPathScopeGuard } from '../../../guards/is-explicit-path-scope/is-explicit-path-scope-guard';
import { isFileScopeRequestedGuard } from '../../../guards/is-file-scope-requested/is-file-scope-requested-guard';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { commandRunLayerFolderBroker } from './command-run-layer-folder-broker';
import { commandRunLayerGitScopeBroker } from './command-run-layer-git-scope-broker';
import { commandRunLayerSingleBroker } from './command-run-layer-single-broker';
import { commandRunLayerMultiBroker } from './command-run-layer-multi-broker';
import { passthroughNormalizeTransformer } from '../../../transformers/passthrough-normalize/passthrough-normalize-transformer';
import { resultToSummaryTransformer } from '../../../transformers/result-to-summary/result-to-summary-transformer';
import { isProjectReferencesModeGuard } from '../../../guards/is-project-references-mode/is-project-references-mode-guard';
import { hasCheckDiscoveryMismatchGuard } from '../../../guards/has-check-discovery-mismatch/has-check-discovery-mismatch-guard';
import { hasUnmatchedTestNamePatternGuard } from '../../../guards/has-unmatched-test-name-pattern/has-unmatched-test-name-pattern-guard';
import { projectReferencesSyncBroker } from '../../project-references/sync/project-references-sync-broker';
import { checkRunTypecheckRefsBroker } from '../../check-run/typecheck-refs/check-run-typecheck-refs-broker';

export const commandRunBroker = async ({
  config,
  rootPath,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const gitScopedConfig = await commandRunLayerGitScopeBroker({ config, rootPath });

  // AN EMPTY FILE SCOPE IS NOT AN ABSENT ONE, and every consumer below this line reads it as one:
  // `hasPassthrough` is `Array.isArray(passthrough) && length > 0` in five separate places, so a
  // `--staged` run whose diff held nothing fell through to grading the ENTIRE repo. Measured on
  // quest a7520e60: each round's reviewer pushes its own round and the NEXT reviewer's `--staged`
  // then has nothing left to measure — one swept 13 packages including e2e in 858s, the other ran
  // past the 600s harness timeout, and both read the wide green as their round's verdict.
  //
  // THE TWO HALVES ARE DIFFERENT QUESTIONS AND ARE ASKED OF DIFFERENT OBJECTS. Whether a file scope
  // was REQUESTED is a property of the config the caller handed in, and `isFileScopeRequestedGuard`
  // reads it off an exhaustive classification of every `wardConfigContract` field — so a file-scoping
  // flag added later is covered here the day it is added, or fails the build. Whether that request
  // RESOLVED is a property of the config AFTER the git scope layer, and only `passthrough` carries
  // it: a git scope that DID resolve to files is an ordinary scoped run and must still execute.
  //
  // Returning here writes no result, so `ward detail <runId>` has nothing to load —
  // `wardDetailBroker` already answers `null` for that and persists no blob, which is the honest
  // record of a run that checked nothing.
  const fileScopeResolvedEmpty =
    isFileScopeRequestedGuard({ config }) &&
    !(Array.isArray(gitScopedConfig.passthrough) && gitScopedConfig.passthrough.length > 0);

  if (fileScopeResolvedEmpty) {
    process.stdout.write(`${fileScopeEmptyStatics.message}\n`);
    return adapterResultContract.parse({ success: true });
  }

  // Every path reaching a check runner is repo-relative with no `./`, because that is the ONE form
  // `hasPassthroughMatchGuard` matches against a package prefix. Both other spellings of the same
  // file — `./packages/…` and the absolute path — matched no package, spawned no child, and left
  // the run reporting `WARN 0 files run` at exit 0. See passthroughNormalizeTransformer.
  const normalizedPassthrough = passthroughNormalizeTransformer({
    passthrough: gitScopedConfig.passthrough,
    rootPath,
  });
  const resolvedConfig: WardConfig =
    normalizedPassthrough === undefined
      ? gitScopedConfig
      : { ...gitScopedConfig, passthrough: normalizedPassthrough };

  // A PATH DISK DOES NOT HAVE IS THE CALLER BEING WRONG, and that is a different answer from the
  // empty scope above. An empty `--staged` legitimately has nothing to check and exits 0; a typo'd
  // `-- <file>` asked for something specific and must not come back quiet. It cannot come back loud
  // on its own either: the path matches no package, no child ward spawns, and
  // `checkResultBuildTransformer` reads an EMPTY `projectResults` as `pass` rather than `skip`.
  //
  // It runs AFTER normalization so the paths asked about are the repaired repo-relative ones, and
  // BEFORE `workspaceDiscoverBroker` so a typo costs no discovery.
  const missingPaths = commandRunLayerPathCheckBroker({
    passthrough: resolvedConfig.passthrough,
    rootPath,
  });

  if (missingPaths.length > 0) {
    const pathList = missingPaths.map((arg) => `  ${String(arg)}`).join('\n');
    process.stdout.write(
      `${pathNotFoundStatics.heading}\n${pathList}\n\n${pathNotFoundStatics.guidance}\n`,
    );
    process.exitCode = wardExitCodeStatics.exitCodes.failing;
    return adapterResultContract.parse({ success: true });
  }

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

  // Every package the pattern reached came back empty, so the pattern itself is wrong. A pattern
  // that matched somewhere leaves the packages without such a test as plain skips.
  if (hasUnmatchedTestNamePatternGuard({ wardResult })) {
    process.stdout.write(
      `\n--onlyTests pattern "${String(resolvedConfig.onlyTests)}" matched 0 tests in any package — possible typo or stale test name\n`,
    );
    process.exitCode = wardExitCodeStatics.exitCodes.failing;
  }

  // THE THIRD SILENCE, and it is neither of the two the short-circuits above catch. The scope was
  // not empty and every path in it resolved — the run went all the way through and still examined
  // nothing. Reproduced live: `npm run ward -- --only lint -- scripts/build-workspaces.mjs` printed
  // `lint: WARN 0 files run` at exit 0, because `scripts/**` sits in eslint.config.js `ignores` and
  // belongs to no workspace package, so no child ward spawned at all.
  //
  // IT BINDS ONLY PATHS A HUMAN TYPED. `commandRunLayerGitScopeBroker` writes a `--changed`/
  // `--staged` diff into the SAME `passthrough` field, and such a diff legitimately holds root-level
  // files nothing lints — reddening those would break the ordinary pre-push gate. So the question is
  // asked of `config`, the object the CALLER handed in, never of `resolvedConfig`.
  if (isExplicitPathScopeGuard({ config }) && hasNoFilesProcessedGuard({ wardResult })) {
    const scopeList = (resolvedConfig.passthrough ?? [])
      .map((arg) => `  ${String(arg)}`)
      .join('\n');
    process.stdout.write(
      `\n${noFilesProcessedStatics.heading}\n${scopeList}\n\n${noFilesProcessedStatics.guidance}\n`,
    );
    process.exitCode = wardExitCodeStatics.exitCodes.failing;
  }

  if (hasFailing) {
    process.stdout.write(
      `\nFull error details: npm run ward -- detail ${wardResult.runId} <filePath>\n`,
    );
    process.exitCode = wardExitCodeStatics.exitCodes.failing;
  }

  // A crashed project means a check never reported on the code at all. Consumers that dispatch
  // ward route on this separately: there is no failing file to fix, so a fix-and-retry loop would
  // just crash again.
  const hasCrash = wardResult.checks.some((check) =>
    check.projectResults.some((projectResult) => isCrashedProjectResultGuard({ projectResult })),
  );

  if (hasCrash) {
    process.exitCode = wardExitCodeStatics.exitCodes.crash;
  }
  return adapterResultContract.parse({ success: true });
};
