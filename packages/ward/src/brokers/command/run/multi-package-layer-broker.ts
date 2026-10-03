/**
 * PURPOSE: Spawns ward runs in each workspace package, loads sub-results, and merges into a combined WardRunResult
 *
 * USAGE:
 * const result = await multiPackageLayerBroker({ config: WardConfigStub(), projectFolders: [...], rootPath });
 * // Returns merged WardRunResult combining all package sub-results
 */

import { stream, RunNotFoundError } from '#gateway/node/child_process';
import { argv, execPath, stderr } from '#gateway/node/process';
import { now } from '#gateway/node/Date';
import { setInterval } from '#gateway/node/setInterval';
import { clearInterval } from '#gateway/node/clearInterval';
import { NodeVersionUnsupportedError } from '#gateway/node/sqlite';
import { promisePoolTransformer } from '@dungeonmaster/shared/transformers';
import { machineResourcesStatics } from '@dungeonmaster/shared/statics';
import {
  capacityReadBroker,
  diskBudgetEnforceBroker,
  leaseTakeBroker,
  leaseBeatBroker,
  leaseReleaseBroker,
  memoryPeakSampleBroker,
} from '@dungeonmaster/load-balancer/brokers';
import { loadBalancerStatics, machineStatics } from '@dungeonmaster/load-balancer/statics';

import {
  wardRunResultContract,
  type WardRunResult,
} from '../../../contracts/ward-run-result/ward-run-result-contract';
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
import { isFileScopeRequestedGuard } from '../../../guards/is-file-scope-requested/is-file-scope-requested-guard';
import { binResolveBroker } from '../../bin/resolve/bin-resolve-broker';
import { childCrashLayerBroker } from './child-crash-layer-broker';
import { storageLoadBroker } from '../../storage/load/storage-load-broker';
import { storageSaveBroker } from '../../storage/save/storage-save-broker';
import { storagePruneBroker } from '../../storage/prune/storage-prune-broker';
import { historyRootFindBroker } from '../../history/root-find/history-root-find-broker';
import { historyReadBroker } from '../../history/read/history-read-broker';
import { historyWriteBroker } from '../../history/write/history-write-broker';
import {
  durationPredictTransformer,
  type DurationPredictions,
} from '../../../transformers/duration-predict/duration-predict-transformer';
import { packageDispatchOrderTransformer } from '../../../transformers/package-dispatch-order/package-dispatch-order-transformer';
import { durationSamplesBuildTransformer } from '../../../transformers/duration-samples-build/duration-samples-build-transformer';

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
  // A child ward is THIS ward: the same node binary running the same entry script this process was
  // started with. Looking `dungeonmaster-ward` up instead resolves through node_modules/.bin and then
  // PATH, which in a worktree lands on the main checkout's globally linked ward — so a worktree that
  // edited and rebuilt ward would be graded by the one it set out to change. The bin lookup stays only
  // for a process not started from a compiled entry script.
  const [, selfEntry] = argv;
  const childCommand =
    selfEntry?.endsWith(wardSpawnCommandStatics.entryScriptExtension) === true
      ? { command: execPath, leadingArgs: [selfEntry] }
      : {
          command: binResolveBroker({ binName: wardSpawnCommandStatics.bin, cwd: rootPath }),
          leadingArgs: [],
        };

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

  let repoRoot = rootPath;
  let dispatchFolders = filteredFolders;
  let historyAvailable = true;
  const predictionsRef: { value?: DurationPredictions } = {};

  if (filteredFolders.length > 0 && checkTypes.length > 0) {
    try {
      repoRoot = await historyRootFindBroker({ rootPath });
      const { samples: historySamples } = historyReadBroker({ repoRoot });
      predictionsRef.value = durationPredictTransformer({ samples: historySamples });
      dispatchFolders = packageDispatchOrderTransformer({
        projectFolders: filteredFolders,
        predictions: predictionsRef.value,
        checkTypes,
      });
    } catch (error: unknown) {
      historyAvailable = false;
      const message = error instanceof Error ? error.message : String(error);
      stderr.write(`ward: duration history unavailable: ${message}\n`);
      dispatchFolders = filteredFolders;
    }
  }

  const expectedPeakByPackage = new Map<string, number | null>();
  if (predictionsRef.value !== undefined) {
    for (const folder of dispatchFolders) {
      const packagePreds = predictionsRef.value.get(folder.name);
      if (!packagePreds) {
        expectedPeakByPackage.set(folder.name, null);
        continue;
      }
      let maxPeak: number | null = null;
      for (const checkType of checkTypes) {
        const peak = packagePreds.get(checkType)?.peakRssMB;
        if (typeof peak === 'number') {
          maxPeak = maxPeak === null ? peak : Math.max(maxPeak, peak);
        }
      }
      expectedPeakByPackage.set(folder.name, maxPeak);
    }
  }

  let inFlightCount = 0;
  const peakRssByPackage = new Map<string, number | null>();
  const shardsByPackage = new Map<string, number | null>();
  const printedWarnings = new Set<string>();
  const degraded = new Set<'capacity' | 'leases'>();

  const unstartedPackages = new Set(dispatchFolders.map((folder) => folder.name));
  const runStartMs = Date.now();
  let currentMaxCpuPercent: number = machineResourcesStatics.maxCpuPercent.default;

  const subResults = await promisePoolTransformer({
    items: dispatchFolders,
    pollIntervalMs: 1000,
    limit: async (): Promise<number> => {
      if (degraded.has('capacity')) {
        return 1;
      }

      let maxExpectedPeak: number | null = null;
      for (const packageName of unstartedPackages) {
        const peak = expectedPeakByPackage.get(packageName) ?? null;
        if (typeof peak === 'number') {
          maxExpectedPeak = maxExpectedPeak === null ? peak : Math.max(maxExpectedPeak, peak);
        }
      }

      try {
        const capacity = await capacityReadBroker({
          diskPath: rootPath,
          job: { peakMB: maxExpectedPeak },
        });

        currentMaxCpuPercent = capacity.resources.maxCpuPercent;

        for (const warning of capacity.warnings) {
          if (!printedWarnings.has(warning)) {
            printedWarnings.add(warning);
            stderr.write(`ward: load balancing degraded: ${warning}\n`);
          }
        }

        const nowMs = Date.now();
        const elapsedMs = nowMs - runStartMs;
        const steps = Math.floor(
          Math.max(0, elapsedMs) / loadBalancerStatics.cpu.ramp.stepIntervalMs,
        );
        const rampLimit =
          loadBalancerStatics.cpu.ramp.initialLimit +
          steps * loadBalancerStatics.cpu.ramp.stepCount;
        const capacityLimit = inFlightCount + capacity.suggestion.suggestion;

        return Math.max(1, Math.min(capacityLimit, rampLimit));
      } catch (error: unknown) {
        if (error instanceof NodeVersionUnsupportedError) {
          throw error;
        }

        degraded.add('capacity');
        const message = error instanceof Error ? error.message : String(error);
        stderr.write(`ward: load balancing degraded: ${message}\n`);

        return 1;
      }
    },
    handler: async (folder) => {
      unstartedPackages.delete(folder.name);
      inFlightCount += 1;

      const jestWorkerLimits = {
        minPercent: 10,
        totalPercent: currentMaxCpuPercent,
      };
      const jestWorkers = Math.max(
        jestWorkerLimits.minPercent,
        Math.floor(jestWorkerLimits.totalPercent / inFlightCount),
      );
      const spawnArgs = [...wardSpawnCommandStatics.baseArgs.map(String)];
      spawnArgs.push(wardSpawnCommandStatics.jestWorkersFlag, String(jestWorkers));

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

      const spawnState: {
        sampler: {
          stop: () => Promise<number | null>;
          getCurrentPeak: () => number | null;
        } | null;
        leaseId: string | null;
        heartbeatTimer: NodeJS.Timeout | null;
        onSpawnPromise: Promise<void> | null;
      } = {
        sampler: null,
        leaseId: null,
        heartbeatTimer: null,
        onSpawnPromise: null,
      };

      try {
        const cwd = folder.path;
        // A missing `dungeonmaster-ward` binary rejects `stream` with RunNotFoundError rather than
        // resolving a result — caught here and folded into the same failed-spawn shape the old
        // spawn-stream adapter resolved for an ENOENT, so a machine without the resolved bin reads
        // as a crashed child below, exactly as it always has.
        const spawnResult = await stream({
          command: childCommand.command,
          args: [...childCommand.leadingArgs, ...spawnArgs],
          cwd,
          onStderr: (line: string) => {
            stderr.write(line);
          },
          onSpawn: ({ pid }: { pid: number }) => {
            if (degraded.has('leases')) {
              return;
            }
            spawnState.onSpawnPromise = (async (): Promise<void> => {
              try {
                spawnState.sampler = await memoryPeakSampleBroker({ rootPid: pid });
                if (degraded.has('leases')) {
                  return;
                }
                const expectedPeakMB = expectedPeakByPackage.get(folder.name) ?? null;
                spawnState.leaseId = await leaseTakeBroker({
                  tool: 'ward',
                  label: folder.name,
                  ownerPid: pid,
                  expectedPeakMB,
                });
                spawnState.heartbeatTimer = setInterval(() => {
                  if (degraded.has('leases') || spawnState.leaseId === null) {
                    if (spawnState.heartbeatTimer !== null) {
                      clearInterval(spawnState.heartbeatTimer);
                      spawnState.heartbeatTimer = null;
                    }
                    return;
                  }
                  leaseBeatBroker({
                    leaseId: spawnState.leaseId,
                    currentRssMB: spawnState.sampler?.getCurrentPeak() ?? null,
                  }).catch((error: unknown) => {
                    if (!degraded.has('leases')) {
                      degraded.add('leases');
                      const message = error instanceof Error ? error.message : String(error);
                      stderr.write(`ward: load balancing degraded: ${message}\n`);
                    }
                    if (spawnState.heartbeatTimer !== null) {
                      clearInterval(spawnState.heartbeatTimer);
                      spawnState.heartbeatTimer = null;
                    }
                  });
                }, loadBalancerStatics.lease.heartbeatIntervalMs);
              } catch (error: unknown) {
                if (!degraded.has('leases')) {
                  degraded.add('leases');
                  const message = error instanceof Error ? error.message : String(error);
                  stderr.write(`ward: load balancing degraded: ${message}\n`);
                }
              }
            })();
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
      } finally {
        inFlightCount -= 1;
        if (spawnState.onSpawnPromise !== null) {
          try {
            await spawnState.onSpawnPromise;
          } catch {
            // Handled inside onSpawnPromise
          }
        }
        if (spawnState.heartbeatTimer !== null) {
          clearInterval(spawnState.heartbeatTimer);
          spawnState.heartbeatTimer = null;
        }
        if (spawnState.sampler !== null) {
          try {
            const peak = await spawnState.sampler.stop();
            peakRssByPackage.set(folder.name, peak);
          } catch (error: unknown) {
            if (!degraded.has('leases')) {
              degraded.add('leases');
              const message = error instanceof Error ? error.message : String(error);
              stderr.write(`ward: load balancing degraded: ${message}\n`);
            }
          }
        }
        if (!degraded.has('leases') && spawnState.leaseId !== null) {
          try {
            await leaseReleaseBroker({ leaseId: spawnState.leaseId });
          } catch (error: unknown) {
            if (!degraded.has('leases')) {
              degraded.add('leases');
              const message = error instanceof Error ? error.message : String(error);
              stderr.write(`ward: load balancing degraded: ${message}\n`);
            }
          }
        }
      }
    },
  });

  const subResultsByPath = new Map(
    dispatchFolders.map((folder, index) => [folder.path, subResults[index]]),
  );
  const orderedSubResults = filteredFolders.flatMap((folder) => {
    const subResult = subResultsByPath.get(folder.path);
    return subResult === undefined ? [] : [subResult];
  });

  const allChecksByType = new Map<CheckType, CheckResult[]>();

  for (const checkType of checkTypes) {
    allChecksByType.set(checkType, []);
  }

  for (const subResult of orderedSubResults) {
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

  const isEligibleForHistory =
    historyAvailable && !isFileScopeRequestedGuard({ config }) && config.onlyTests === undefined;

  if (isEligibleForHistory && filteredFolders.length > 0) {
    const wholePackageNames = filteredFolders.map((folder) => folder.name);
    const samplesToWrite = durationSamplesBuildTransformer({
      repoRoot,
      checks: foldedChecks,
      wholePackageNames,
      nowMs: now(),
      peakRssByPackage,
      shardsByPackage,
    });

    if (samplesToWrite.length > 0) {
      try {
        historyWriteBroker({ samples: samplesToWrite });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        stderr.write(`ward: duration history unavailable: ${message}\n`);
      }
    }
  }

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

  try {
    const diskBudgetResult = await diskBudgetEnforceBroker({ currentRepoRoot: repoRoot });
    if (diskBudgetResult.ran) {
      if (diskBudgetResult.deletedCount > 0) {
        const freedMB = Math.round(
          diskBudgetResult.deletedBytes / machineStatics.units.bytesPerMegabyte,
        );
        stderr.write(
          `ward: disk budget freed ${freedMB} MB (${diskBudgetResult.deletedCount} items)\n`,
        );
      }
      if (diskBudgetResult.shortfallBytes > 0) {
        const shortfallMB = Math.round(
          diskBudgetResult.shortfallBytes / machineStatics.units.bytesPerMegabyte,
        );
        stderr.write(`ward: disk budget shortfall: ${shortfallMB} MB\n`);
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`ward: disk budget unavailable: ${message}\n`);
  }

  return wardResult;
};
