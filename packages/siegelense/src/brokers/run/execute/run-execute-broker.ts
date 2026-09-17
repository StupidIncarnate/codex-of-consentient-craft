/**
 * PURPOSE: Runs one whole `run` request against a booted `LaneSession`, end to end, and returns a
 * STATUS rather than a payload (siegelense-tooling.md line 49: "run → submit a BATCH of steps;
 * blocks; returns a STATUS, never a payload"). Records the instance's continuous browser/server
 * buffers as THIS run's own window before anything dispatches (line 90: "a run's index counts its
 * OWN window, never the running total"), restarts step numbering at 1 inside a run-namespaced shots
 * directory (line 1630) — every acting step's unasked capture resolves there by index, and a
 * `screenshot` step resolves by its own `name` (line 2516) instead, still inside that same
 * run-namespaced directory so two runs never collide on one caller-chosen filename — flushes the
 * transcript after every step rather than buffering it (line
 * 1676), and stops on the first failing step unless the caller set `stopOn: 'never'` (line 1638).
 * `runExecuteStepLayerBroker` is what turns BOTH an uncaught exception and the dispatcher's own
 * `expect: 'error'`-but-succeeded finding into the same `ok: false` reading, so the loop below only
 * ever has ONE stop condition to check. `status` reads whether the run's first stop carries
 * `timedOut` — set only when the underlying step threw `WaitForCeilingHitError` — rather than
 * sniffing `stoppedAt.error` text for the word "timeout", so a driver rewording its own message
 * never flips the run's own verdict. Each shot listing carries the SAME `pixelChange`, `blank` and
 * `blankColour` its source `StepReading` carries, rather than re-deriving them — a `ShotListing` is a
 * projection of the step that captured it, and the two must never disagree about whether that
 * capture was blank. At run start the console/network/websocket lines that arrived SINCE the last
 * flush and BEFORE this run's own window began are flushed as `{runId: null, step: null}`
 * (chunk-03-read-path-and-perception.md §3.A) — entries that belong to neither the previous run nor
 * this one — and after every step's transcript append, that step's OWN new lines are flushed tagged
 * with this run and step, advancing the cursor each time. The running cursor lives in a `cursorState`
 * HOLDER whose field mutates, rather than a reassigned `let`, so ESLint's `require-atomic-updates`
 * (a read before an await, a write after it, in the same async scope) never has cause to flag the
 * per-step flush. `flushCursor`/`advanceFlushCursor`/`lastShotPath`/`setLastShotPath` arrive as
 * PARAMETERS rather than read from `driverSessionState` directly — a broker's allowed imports do not
 * include `state/` (see `driver-handle-request-broker.ts`'s own header for the identical constraint)
 * — so the responder that owns the socket's request loop reads these accessors fresh per request and
 * hands them down explicitly, the same way `mintRunId` already does. Every step's own shot joins
 * under `locationsRepoLinkPathFindBroker`'s repo-local alias of `shotsDir`, never the raw `shotsDir`
 * itself (packages/siegelense/CLAUDE.md: "every path handed back is repo-local, through
 * <repoRoot>/.siegelense") — the same address is both what the step actually captures to and what
 * `RunResult.shots`/the transcript report, so a later `results` read of this run's own evidence never
 * disagrees with what this run just returned. It also mints the automatic snapshot pair — one capture
 * of the lane's throwaway home before the first step and one after the last, named `run_N:start` and
 * `run_N:end` (line 2630) — which is what `snapshots` lists and what `reset level: 'state'` returns
 * to. Both are fire-and-forget: a capture that fails is logged and the batch continues, since a
 * restore-point write must never replace the walk's own result, and `snapshotCaptureBroker` appends
 * its index line only after the payload lands, so a failed capture leaves no row at all rather than a
 * row pointing at nothing.
 *
 * USAGE:
 * await runExecuteBroker({
 *   lane, instanceId: InstanceIdStub(), runId: RunIdStub({ value: 'run_1' }),
 *   steps: [StepStub({ step: 'goto', path: UrlPathStub() })], stopOn: StopOnStub(),
 *   flushCursor: driverSessionState.flushCursor, advanceFlushCursor: driverSessionState.advanceFlushCursor,
 *   lastShotPath: driverSessionState.lastShotPath, setLastShotPath: driverSessionState.setLastShotPath,
 * });
 * // Runs the batch, writes runs/run_1.jsonl and runs/run_1.json, flushes the buffers, and returns the RunResult
 */

import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { bufferEntryContract } from '../../../contracts/buffer-entry/buffer-entry-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { runResultContract } from '../../../contracts/run-result/run-result-contract';
import type { RunResult } from '../../../contracts/run-result/run-result-contract';
import { snapshotBoundaryContract } from '../../../contracts/snapshot-boundary/snapshot-boundary-contract';
import { runStatusContract } from '../../../contracts/run-status/run-status-contract';
import type { RunStatus } from '../../../contracts/run-status/run-status-contract';
import { shotListingContract } from '../../../contracts/shot-listing/shot-listing-contract';
import type { ShotListing } from '../../../contracts/shot-listing/shot-listing-contract';
import type { Step } from '../../../contracts/step/step-contract';
import { stepIndexContract } from '../../../contracts/step-index/step-index-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import type { StopOn } from '../../../contracts/stop-on/stop-on-contract';
import type { StoppedAt } from '../../../contracts/stopped-at/stopped-at-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { stepStatics } from '../../../statics/step/step-statics';
import { runIndexComputeTransformer } from '../../../transformers/run-index-compute/run-index-compute-transformer';
import { shotOpenDecideTransformer } from '../../../transformers/shot-open-decide/shot-open-decide-transformer';
import { snapshotAutoNameTransformer } from '../../../transformers/snapshot-auto-name/snapshot-auto-name-transformer';
import { bufferAppendBroker } from '../../buffer/append/buffer-append-broker';
import { snapshotCaptureBroker } from '../../snapshot/capture/snapshot-capture-broker';
import { locationsBufferPathsFindBroker } from '../../locations/buffer-paths-find/locations-buffer-paths-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
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
  flushCursor,
  advanceFlushCursor,
  lastShotPath,
  setLastShotPath,
}: {
  lane: LaneSession;
  instanceId: InstanceId;
  runId: RunId;
  steps: readonly Step[];
  stopOn: StopOn;
  flushCursor: () => {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  };
  advanceFlushCursor: (params: {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  }) => void;
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
}): Promise<RunResult> => {
  const browserWindowStart = lane.browser === null ? null : lane.browser.bufferLengths();
  const serverWindowStartByte = lane.serverLogLength();

  const { transcript, storedReturn, shotsDir } = locationsRunPathsFindBroker({
    evidencePath: lane.evidencePath,
    runId,
  });
  await fsMkdirAdapter({ filepath: filePathContract.parse(shotsDir) });

  // packages/siegelense/CLAUDE.md: "every path handed back is repo-local, through
  // <repoRoot>/.siegelense" — `start`, `status` and `kill` already resolve their evidence path
  // through `locationsRepoLinkPathFindBroker` before returning; this broker skipped it, so a run's
  // own shots (and, via the transcript and the stored return this run persists, every later
  // `results` read of them) reported the real home path instead. `shotsDir` above stays real — the
  // mkdir needs a path guaranteed to exist whether or not `dungeonmaster init` ever ran here — but
  // every step's own shot joins under this repo-local alias instead, so the address a step actually
  // captures to and the address RunResult/the transcript report are the SAME string: writing
  // through a valid directory symlink reaches the identical file. `linkPresent: false` falls the
  // alias back to this same real `shotsDir`, so a repo that never ran `dungeonmaster init` writes
  // and reports exactly as it did before this resolution existed.
  const { path: reportedShotsDir } = await locationsRepoLinkPathFindBroker({ homePath: shotsDir });

  const bufferPaths = locationsBufferPathsFindBroker({ evidencePath: lane.evidencePath });

  // The cursor this run leaves the buffers at, advanced twice: once below for the between-runs
  // tail, then once per step inside the loop. A HOLDER whose field mutates, not a reassigned `let`
  // — a read before an await followed by a write after it, on the same `let`, is exactly what
  // `require-atomic-updates` flags, and the field-assignment form falls outside that check. Seeded
  // from the caller's own accessor so a headless lane (no browser, nothing ever flushed) simply
  // never moves it.
  const cursorState: {
    flushedThrough: {
      consoleLines: ReadingCount;
      networkLines: ReadingCount;
      websocketLines: ReadingCount;
    };
  } = { flushedThrough: flushCursor() };

  if (lane.browser !== null && browserWindowStart !== null) {
    const tailConsoleLines = lane.browser.readConsoleSince({
      fromIndex: cursorState.flushedThrough.consoleLines,
    });
    const tailNetworkLines = lane.browser.readNetworkSince({
      fromIndex: cursorState.flushedThrough.networkLines,
    });
    const tailWebsocketLines = lane.browser.readWebsocketSince({
      fromIndex: cursorState.flushedThrough.websocketLines,
    });
    const tailFlushedAtMs = epochMsContract.parse(Date.now());
    const tailConsoleEntries = tailConsoleLines.map((text) =>
      bufferEntryContract.parse({ runId: null, step: null, atMs: tailFlushedAtMs, text }),
    );
    const tailNetworkEntries = tailNetworkLines.map((text) =>
      bufferEntryContract.parse({ runId: null, step: null, atMs: tailFlushedAtMs, text }),
    );
    const tailWebsocketEntries = tailWebsocketLines.map((text) =>
      bufferEntryContract.parse({ runId: null, step: null, atMs: tailFlushedAtMs, text }),
    );

    // Advanced BEFORE the writes below settle, not after: every value this reads (`readConsoleSince`
    // et al.) and every value it writes (`cursorState.flushedThrough`) is computed synchronously —
    // reading `cursorState` again after an `await` on the SAME turn is what `require-atomic-updates`
    // flags, so the update happens on this turn instead, with no await between the read and the write.
    cursorState.flushedThrough = {
      consoleLines: readingCountContract.parse(browserWindowStart.consoleLines),
      networkLines: readingCountContract.parse(browserWindowStart.networkLines),
      websocketLines: readingCountContract.parse(browserWindowStart.websocketLines),
    };
    advanceFlushCursor(cursorState.flushedThrough);

    await Promise.all([
      bufferAppendBroker({ bufferPath: bufferPaths.console, entries: tailConsoleEntries }),
      bufferAppendBroker({ bufferPath: bufferPaths.network, entries: tailNetworkEntries }),
      bufferAppendBroker({ bufferPath: bufferPaths.websocket, entries: tailWebsocketEntries }),
    ]);
  }

  // The automatic `run_N:start` half of the pair (siegelense-tooling.md line 2630: "Every run also
  // snapshots automatically, at start and at end"). Taken before the first step dispatches, so it is
  // the state the batch began from. A capture failure is LOGGED and the run continues — the batch's
  // own result must never be replaced by a restore-point write, the same rule `step-dispatch-broker`
  // already follows for a failure capture — and because `snapshotCaptureBroker` appends its index
  // line only after the payload lands, a failure here leaves no row claiming a restore point that is
  // not on disk.
  await snapshotCaptureBroker({
    homePath: lane.homePath,
    name: snapshotAutoNameTransformer({
      runId,
      boundary: snapshotBoundaryContract.parse('start'),
    }),
    manual: false,
  }).catch((error: unknown) => {
    process.stderr.write(`[run-execute] start snapshot failed for ${runId}: ${String(error)}\n`);
  });

  const readings: StepReading[] = [];
  const stopCandidates: { stoppedAt: StoppedAt; timedOut: boolean }[] = [];

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
      ? locationsShotPathFindBroker({ shotsDir: reportedShotsDir, step: index })
      : step.step === 'screenshot'
        ? locationsShotPathFindBroker({ shotsDir: reportedShotsDir, step: index, name: step.name })
        : null;

    const outcome = await runExecuteStepLayerBroker({
      lane,
      step,
      index,
      shotPath,
      lastShotPath,
      setLastShotPath,
    });
    readings.push(outcome.reading);
    await runTranscriptAppendBroker({ transcriptPath: transcript, reading: outcome.reading });

    if (lane.browser !== null) {
      const afterStepLengths = lane.browser.bufferLengths();
      const stepConsoleLines = lane.browser.readConsoleSince({
        fromIndex: cursorState.flushedThrough.consoleLines,
      });
      const stepNetworkLines = lane.browser.readNetworkSince({
        fromIndex: cursorState.flushedThrough.networkLines,
      });
      const stepWebsocketLines = lane.browser.readWebsocketSince({
        fromIndex: cursorState.flushedThrough.websocketLines,
      });
      const stepFlushedAtMs = epochMsContract.parse(Date.now());
      const stepConsoleEntries = stepConsoleLines.map((text) =>
        bufferEntryContract.parse({ runId, step: index, atMs: stepFlushedAtMs, text }),
      );
      const stepNetworkEntries = stepNetworkLines.map((text) =>
        bufferEntryContract.parse({ runId, step: index, atMs: stepFlushedAtMs, text }),
      );
      const stepWebsocketEntries = stepWebsocketLines.map((text) =>
        bufferEntryContract.parse({ runId, step: index, atMs: stepFlushedAtMs, text }),
      );

      // Advanced before the writes settle — see the identical comment on the between-runs tail
      // flush above for why.
      cursorState.flushedThrough = {
        consoleLines: readingCountContract.parse(afterStepLengths.consoleLines),
        networkLines: readingCountContract.parse(afterStepLengths.networkLines),
        websocketLines: readingCountContract.parse(afterStepLengths.websocketLines),
      };
      advanceFlushCursor(cursorState.flushedThrough);

      await Promise.all([
        bufferAppendBroker({ bufferPath: bufferPaths.console, entries: stepConsoleEntries }),
        bufferAppendBroker({ bufferPath: bufferPaths.network, entries: stepNetworkEntries }),
        bufferAppendBroker({ bufferPath: bufferPaths.websocket, entries: stepWebsocketEntries }),
      ]);
    }

    if (outcome.stoppedAt !== null) {
      stopCandidates.push({ stoppedAt: outcome.stoppedAt, timedOut: outcome.timedOut });
    }
  }, Promise.resolve());

  // The `run_N:end` half, taken once the batch has stopped running — the point "put it back to where
  // run N finished" returns to. Same swallow-and-log rule as the start half above.
  await snapshotCaptureBroker({
    homePath: lane.homePath,
    name: snapshotAutoNameTransformer({ runId, boundary: snapshotBoundaryContract.parse('end') }),
    manual: false,
  }).catch((error: unknown) => {
    process.stderr.write(`[run-execute] end snapshot failed for ${runId}: ${String(error)}\n`);
  });

  // The FIRST failure only — a later one under stopOn: 'never' still gets its own transcript
  // entry, but the run's own verdict reports where it would have stopped.
  const firstStop = stopCandidates.at(0) ?? null;
  const stoppedAt: StoppedAt | null = firstStop === null ? null : firstStop.stoppedAt;

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
        pixelChange: reading.pixelChange,
        blank: reading.blank,
        blankColour: reading.blankColour,
      }),
    );
  const shots = shotOpenDecideTransformer({
    shots: rawShots,
    failedStep: stoppedAt === null ? null : stoppedAt.step,
  });

  const status: RunStatus =
    firstStop === null
      ? runStatusContract.parse('done')
      : runStatusContract.parse(firstStop.timedOut ? 'timeout' : 'failed');

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
