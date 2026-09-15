/**
 * PURPOSE: Runs one whole `run` request against a booted `LaneSession`, end to end, and returns a
 * STATUS rather than a payload (siegelense-tooling.md line 49: "run → submit a BATCH of steps;
 * blocks; returns a STATUS, never a payload"). Records the instance's continuous browser/server
 * buffers as THIS run's own window before anything dispatches (line 90: "a run's index counts its
 * OWN window, never the running total"), restarts step numbering at 1 inside a run-namespaced shots
 * directory (line 1630), flushes the transcript after every step rather than buffering it (line
 * 1676), and stops on the first failing step unless the caller set `stopOn: 'never'` (line 1638).
 * `runExecuteStepLayerBroker` is what turns BOTH an uncaught exception and the dispatcher's own
 * `expect: 'error'`-but-succeeded finding into the same `ok: false` reading, so the loop below only
 * ever has ONE stop condition to check.
 *
 * USAGE:
 * await runExecuteBroker({
 *   lane, instanceId: InstanceIdStub(), runId: RunIdStub({ value: 'run_1' }),
 *   steps: [StepStub({ step: 'goto', path: UrlPathStub() })], stopOn: StopOnStub(),
 * });
 * // Runs the batch, writes runs/run_1.jsonl and runs/run_1.json, and returns the RunResult
 */

import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { runResultContract } from '../../../contracts/run-result/run-result-contract';
import type { RunResult } from '../../../contracts/run-result/run-result-contract';
import { runStatusContract } from '../../../contracts/run-status/run-status-contract';
import type { RunStatus } from '../../../contracts/run-status/run-status-contract';
import { shotListingContract } from '../../../contracts/shot-listing/shot-listing-contract';
import type { ShotListing } from '../../../contracts/shot-listing/shot-listing-contract';
import type { Step } from '../../../contracts/step/step-contract';
import { stepIndexContract } from '../../../contracts/step-index/step-index-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import type { StopOn } from '../../../contracts/stop-on/stop-on-contract';
import type { StoppedAt } from '../../../contracts/stopped-at/stopped-at-contract';
import { isTimeoutMessageGuard } from '../../../guards/is-timeout-message/is-timeout-message-guard';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { stepStatics } from '../../../statics/step/step-statics';
import { runIndexComputeTransformer } from '../../../transformers/run-index-compute/run-index-compute-transformer';
import { shotOpenDecideTransformer } from '../../../transformers/shot-open-decide/shot-open-decide-transformer';
import { locationsRunPathsFindBroker } from '../../locations/run-paths-find/locations-run-paths-find-broker';
import { locationsShotPathFindBroker } from '../../locations/shot-path-find/locations-shot-path-find-broker';
import { runReturnWriteBroker } from '../return-write/run-return-write-broker';
import { runTranscriptAppendBroker } from '../transcript-append/run-transcript-append-broker';
import { runExecuteStepLayerBroker } from './run-execute-step-layer-broker';

export const runExecuteBroker = async ({
  lane,
  instanceId,
  runId,
  steps,
  stopOn,
}: {
  lane: LaneSession;
  instanceId: InstanceId;
  runId: RunId;
  steps: readonly Step[];
  stopOn: StopOn;
}): Promise<RunResult> => {
  const browserWindowStart = lane.browser === null ? null : lane.browser.bufferLengths();
  const serverWindowStartByte = lane.serverLogLength();

  const { transcript, storedReturn, shotsDir } = locationsRunPathsFindBroker({
    evidencePath: lane.evidencePath,
    runId,
  });
  await fsMkdirAdapter({ filepath: filePathContract.parse(shotsDir) });

  const readings: StepReading[] = [];
  const stoppedAtCandidates: StoppedAt[] = [];

  // A sequential reduce chain, not a for-of with await: each step's dispatch depends on the page
  // state the PREVIOUS step left behind, and the transcript must flush in that same order, so
  // `no-await-in-loop` (error, repo-wide) forbids the loop-statement form of this same sequencing —
  // matches package-scaffold-write-broker.ts's own reduce chain. Neither accumulator array is ever
  // REASSIGNED (only pushed to), so "should this iteration still dispatch" reads the current state
  // of `readings` fresh each time rather than a `let` flag shared across the async boundary.
  await steps.reduce(async (previous, step, position) => {
    await previous;

    const alreadyStopped = stopOn === 'error' && readings.some((reading) => !reading.ok);
    if (alreadyStopped) {
      return;
    }

    const index = stepIndexContract.parse(position + instanceLifecycleStatics.numbering.firstStep);
    const shotPath = stepStatics.verbs.acting.some((verb) => verb === step.step)
      ? locationsShotPathFindBroker({ shotsDir, step: index })
      : null;

    const outcome = await runExecuteStepLayerBroker({ lane, step, index, shotPath });
    readings.push(outcome.reading);
    await runTranscriptAppendBroker({ transcriptPath: transcript, reading: outcome.reading });

    if (outcome.stoppedAt !== null) {
      stoppedAtCandidates.push(outcome.stoppedAt);
    }
  }, Promise.resolve());

  // The FIRST failure only — a later one under stopOn: 'never' still gets its own transcript
  // entry, but the run's own verdict reports where it would have stopped.
  const stoppedAt: StoppedAt | null = stoppedAtCandidates.at(0) ?? null;

  const consoleLines: readonly ContentText[] =
    lane.browser === null || browserWindowStart === null
      ? []
      : lane.browser.readConsoleSince({ fromIndex: browserWindowStart.consoleLines });
  const networkLines: readonly ContentText[] =
    lane.browser === null || browserWindowStart === null
      ? []
      : lane.browser.readNetworkSince({ fromIndex: browserWindowStart.networkLines });
  const serverLines = lane.readServerLogSince({ fromByte: serverWindowStartByte });

  const index = runIndexComputeTransformer({ consoleLines, networkLines, serverLines });

  const rawShots: ShotListing[] = readings
    .filter((reading) => reading.shot !== null)
    .map((reading) =>
      shotListingContract.parse({
        step: reading.step,
        path: reading.shot,
        open: false,
        why: null,
        node: reading.node,
      }),
    );
  const shots = shotOpenDecideTransformer({
    shots: rawShots,
    failedStep: stoppedAt === null ? null : stoppedAt.step,
  });

  const status: RunStatus =
    stoppedAt === null
      ? runStatusContract.parse('done')
      : runStatusContract.parse(
          isTimeoutMessageGuard({ message: stoppedAt.error }) ? 'timeout' : 'failed',
        );

  const result = runResultContract.parse({
    instanceId,
    runId,
    status,
    stepsRun: stepIndexContract.parse(readings.length),
    stoppedAt,
    index,
    shots,
  });

  await runReturnWriteBroker({ storedReturnPath: storedReturn, result });

  return result;
};
