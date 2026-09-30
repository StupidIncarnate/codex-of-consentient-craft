/**
 * PURPOSE: Spawns ward runs in each workspace package, loads sub-results, and merges into a combined WardResult
 *
 * USAGE:
 * const result = await multiPackageLayerBroker({ config: WardConfigStub(), projectFolders: [...], rootPath });
 * // Returns merged WardResult combining all package sub-results
 */

import { stream, RunNotFoundError } from '#gateway/node/child_process';
import { stderr } from '#gateway/node/process';
import { promisePoolTransformer } from '@dungeonmaster/shared/transformers';
import { configResolveBroker, configDefaultsStatics } from '@dungeonmaster/config';

import {
  wardRunResultContract,
  type WardRunResult,
} from '../../../contracts/ward-result/ward-result-contract';
import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import type { CheckResult } from '../../../contracts/check-result/check-result-contract';
import type { CheckType } from '../../../contracts/check-type/check-type-contract';
import { allCheckTypesStatics } from '../../../statics/all-check-types/all-check-types-statics';
import { wardSpawnCommandStatics } from '../../../statics/ward-spawn-command/ward-spawn-command-statics';
import { runIdGenerateTransformer } from '../../../transformers/run-id-generate/run-id-generate-transformer';
import { checkResultBuildTransformer } from '../../../transformers/check-result-build/check-result-build-transformer';
import { foldProjectResultIntoChecksTransformer } from '../../../transformers/fold-project-result-into-checks/fold-project-result-into-checks-transformer';
import {
  projectResultContract,
  type ProjectResult,
} from '../../../contracts/project-result/project-result-contract';
import { extractChildRunIdTransformer } from '../../../transformers/extract-child-run-id/extract-child-run-id-transformer';
import { hasPassthroughMatchGuard } from '../../../guards/has-passthrough-match/has-passthrough-match-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { childCrashLayerBroker } from './child-crash-layer-broker';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';

export const multiPackageLayerBroker = async ({
  config,
  projectFolders,
  rootPath,
  platformDedupeProjectResult,
}: {
  config: WardConfig;
  projectFolders: ProjectFolder[];
  rootPath: string;
  platformDedupeProjectResult?: ProjectResult;
}): Promise<WardRunResult> => {
  const runId = runIdGenerateTransformer();
  const timestamp = Date.now();
  const wardBin = binResolveBroker({
      binName: wardSpawnCommandStatics.bin,
      cwd: rootPath,
    });

  const checkTypes = config.only ?? [...allCheckTypesStatics];
  const hasPassthrough = Array.isArray(config.passthrough) && config.passthrough.length > 0;

  const filteredFolders =
    hasPassthrough && config.passthrough
      ? projectFolders.filter((folder) =>
          config.passthrough?.some((arg) =>
            hasPassthroughMatchGuard({
              passthroughArg: arg,
              projectFolder: folder,
              rootPath,
            }),
          ),
        )
      : projectFolders;

  // Resolved ONCE per run, before the promisePoolTransformer loop below spawns any per-folder
  // handler — moving this inside that handler would re-walk the config tree once per workspace
  // instead of once for the whole run. A consumer whose .dungeonmaster.json carries no `ward` key
  // at all gets `ward: undefined` back (zod never fills a default for an absent PARENT key, only
  // for fields inside one that's present), so the fallback to configDefaultsStatics is load-bearing,
  // not decorative.
  const dungeonmasterConfig = await configResolveBroker({
    filePath: `${rootPath}/package.json`,
  });
  const CONCURRENCY_LIMIT = Number(
    dungeonmasterConfig.ward?.concurrency ?? configDefaultsStatics.ward.concurrency.default,
  );

  const runStartMs = Date.now();

  const subResults = await promisePoolTransformer({
    items: filteredFolders,
    concurrency: CONCURRENCY_LIMIT,
    handler: async (folder) => {
      const spawnArgs = wardSpawnCommandStatics.baseArgs.map(String);

      if (config.only) {
        spawnArgs.push('--only', config.only.join(','));
      }

      if (config.onlyTests) {
        // The child is already narrowed — this handler runs once per folder `filteredFolders`
        // picked — so it must not be held to the rule that a HUMAN typing `--onlyTests` names the
        // files too. Without the marker, a whole-package arg (`-- packages/ward`) slices to an
        // empty per-file list, the `--` below is skipped, and the child dies at CLI-parse time.
        spawnArgs.push(
          '--onlyTests',
          String(config.onlyTests),
          wardSpawnCommandStatics.parentScopedFlag,
        );
      }

      if (hasPassthrough && config.passthrough) {
        const prefix = `${folder.path.slice(rootPath.length + 1)}/`;
        const matchingArgs = config.passthrough
          .filter((arg) =>
            hasPassthroughMatchGuard({
              passthroughArg: arg,
              projectFolder: folder,
              rootPath,
            }),
          )
          .map((arg) => arg.slice(prefix.length))
          .filter((arg) => arg.length > 0);

        if (matchingArgs.length > 0) {
          spawnArgs.push('--', ...matchingArgs.map(String));
        }
      }

      const cwd = folder.path;
      // A missing `dungeonmaster-ward` binary rejects `stream` with RunNotFoundError rather than
      // resolving a result — caught here and folded into the same failed-spawn shape the old
      // spawn-stream adapter resolved for an ENOENT, so a machine without the resolved bin reads
      // as a crashed child below, exactly as it always has.
      const spawnResult = await stream({
        command: wardBin,
        args: spawnArgs,
        cwd,
        onStderr: (line: string) => {
          stderr.write(line);
        },
      }).catch((error: unknown) => {
        if (!(error instanceof RunNotFoundError)) {
          throw error;
        }
        return { exitCode: null, output: '', signal: null };
      });

      const pkgRootPath = folder.path;
      const childRunId = extractChildRunIdTransformer({ output: spawnResult.output });

      // ONLY THIS RUN'S ID MAY BE LOADED. `storageLoadBroker` with no `runId` returns the NEWEST
      // file in the package's `.ward/`, which is the PREVIOUS run — so a child that died before
      // printing its `run: <id>` summary line was reported as whatever that package last managed
      // to do, at exit 0. Reproduced live with a child killed at CLI-parse time: `unit: PASS 1
      // packages (163 discovered) 2.0s` for a run whose whole wall clock was 0.2s, byte-identical
      // across consecutive invocations. It also defeats `hasNoFilesProcessedGuard`, because the
      // stale result claims files were processed.
      //
      // A child that reached its summary ALWAYS printed the line — `commandRunBroker` writes the
      // summary and the result file from the same `wardResult`, and the two paths that return
      // before it (an empty file scope, a path not on disk) write neither, so a missing id means
      // no result of this run's exists to merge. `stdout` alone is captured, on `close` rather
      // than `exit`, so nothing colours or truncates the line out from under the match.
      const result =
        childRunId === null
          ? null
          : await storageLoadBroker({ rootPath: pkgRootPath, runId: childRunId });

      if (result !== null) {
        return result;
      }

      // The child wrote no readable result. Its checks cannot be merged, so report the package as
      // crashed — silently dropping it would render the whole package as passing.
      return {
        checks: childCrashLayerBroker({
          projectFolder: folder,
          checkTypes,
          exitCode: spawnResult.exitCode === null ? null : spawnResult.exitCode,
          output: spawnResult.output,
        }),
      };
    },
  });

  const allChecksByType = new Map<CheckType, CheckResult[]>();

  for (const checkType of checkTypes) {
    allChecksByType.set(checkType, []);
  }

  for (const subResult of subResults) {
    for (const check of subResult.checks) {
      const bucket = allChecksByType.get(check.checkType);
      if (bucket !== undefined) {
        bucket.push(check);
      }
    }
  }

  const checks = checkTypes.map((checkType) => {
    const bucket = allChecksByType.get(checkType) ?? [];
    // Each entry in `bucket` is one CHILD ward's CheckResult for this checkType — a child runs
    // scoped to exactly one package, so its `durationMs` is that package's own wall clock, not the
    // whole check's. Stamping it onto every ProjectResult the child reported keeps that per-package
    // number instead of losing it to the checkType-level aggregate below.
    const projectResults = bucket.flatMap((c) =>
      c.projectResults.map((projectResult) =>
        projectResultContract.parse({ ...projectResult, durationMs: Number(c.durationMs) }),
      ),
    );
    // checkResultContract's durationMs stays the WALL CLOCK for the whole check: children in
    // `bucket` run concurrently (see promisePoolTransformer above), so the slowest one bounds how
    // long the check took overall — do not average or sum these.
    const aggregatedDurationMs = Math.max(0, ...bucket.map((c) => Number(c.durationMs)));
    return checkResultBuildTransformer({
      checkType,
      projectResults,
      durationMs: aggregatedDurationMs,
    });
  });

  const totalDurationMs = Date.now() - runStartMs;

  // Folded in AFTER every child spawn and aggregation above finishes, never inside the per-package
  // pool: `platformDedupeProjectResult` is computed once for the whole repo by `commandRunBroker`,
  // not once per package.
  const foldedChecks = foldProjectResultIntoChecksTransformer({
    checks,
    checkType: 'lint',
    ...(platformDedupeProjectResult === undefined
      ? {}
      : { extraProjectResult: platformDedupeProjectResult }),
  });

  const wardResult = wardRunResultContract.parse({
    runId,
    timestamp,
    // THE GIT FLAGS RIDE ALONG BECAUSE `passthrough` CANNOT SPEAK FOR ITSELF. `gitScopeLayerBroker`
    // writes a `--committed`/`--uncommitted` diff into that same field, so a saved result carrying
    // the list alone reads back as a list the caller typed — and `isCallerFileScopeGuard`, which
    // every report surface narrows on, would then treat an unbounded diff as a handful of files.
    filters: {
      ...(config.only ? { only: config.only } : {}),
      ...(config.committed === true ? { committed: true } : {}),
      ...(config.uncommitted === true ? { uncommitted: true } : {}),
      ...(hasPassthrough ? { passthrough: config.passthrough } : {}),
    },
    checks: foldedChecks,
    durationMs: totalDurationMs,
  });

  await storageSaveBroker({ rootPath, wardResult });
  await storagePruneBroker({ rootPath });

  return wardResult;
};
