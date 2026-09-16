/**
 * PURPOSE: Runs ONE step through `stepDispatchBroker` and turns whatever comes back into a triple
 * the parent's loop can act on uniformly: a `StepReading` for the transcript, the `StoppedAt`
 * describing a failure (`null` on success), and whether that failure was a `waitFor` hitting its own
 * ceiling. Split out of `run-execute-broker.ts` because it is the one place an UNCAUGHT exception (a
 * step whose own broker threw because `expect` was not `'error'`) is caught rather than left to
 * crash the batch: "a step's failure is CAUGHT and recorded as a reading, which is different from
 * swallowing" — the exception becomes an `ok: false` reading exactly like the dispatcher's own
 * `expect: 'error'`-but-succeeded finding, so the parent's `stopOn` check never has to know which of
 * the two produced it. `timedOut` reads `error instanceof WaitForCeilingHitError` rather than the
 * rendered message, so `runExecuteBroker` can tell `status: 'timeout'` apart from `status: 'failed'`
 * without parsing prose the underlying driver could reword out from under it. "A timeout must NAME
 * the step" (siegelense-tooling.md line 101) is satisfied here, since `step` and `verb` are known at
 * the call site even when the underlying error carries neither. `serverWindow` is required on every
 * `StepReading`, never nullable, so the uncaught-exception branch reads `lane.serverLogLength()`
 * itself rather than defaulting it — `stepDispatchBroker` never returns a reading on this path, only
 * a rethrown error, so there is no upstream reading to inherit one from. When that rethrow is a
 * `StepFailureCaptureError` (a real failure whose failure-path capture was actually attempted), this
 * broker unwraps it FIRST — the message extraction and the `WaitForCeilingHitError` timeout check
 * both run against `.underlyingError`, never the wrapper — and gates the reading's `shot` on
 * `.captured`, so a capture that never landed is reported as `null` rather than a path naming a
 * missing file. `blank`, `blankColour` and `pixelChange` ride the same gate: `stepDispatchBroker`
 * already measured them against the SAME capture `.captured` reports on, so this broker reads
 * `.blank`/`.blankColour`/`.pixelChange` straight off the wrapper rather than re-deriving or
 * hardcoding them — a REAL failure whose capture landed must carry the same evidence a success would
 * have, since `blank` is the one VERDICT field in this design. `lastShotPath`/
 * `setLastShotPath` are threaded straight through to `stepDispatchBroker` unchanged — a broker's
 * allowed imports do not include `state/`, so this file never reads the INSTANCE's last-capture
 * pointer itself, only carries the caller's accessor one layer further down.
 *
 * USAGE:
 * await runExecuteStepLayerBroker({
 *   lane, step: StepStub({ step: 'goto', path: UrlPathStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: null,
 *   lastShotPath: driverSessionState.lastShotPath, setLastShotPath: driverSessionState.setLastShotPath,
 * });
 * // Returns { reading, stoppedAt: null, timedOut: false } on success, or
 * // { reading, stoppedAt, timedOut } once ok is false
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { serverLogWindowContract } from '../../../contracts/server-log-window/server-log-window-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import { stepVerbContract } from '../../../contracts/step-verb/step-verb-contract';
import { stoppedAtContract } from '../../../contracts/stopped-at/stopped-at-contract';
import type { StoppedAt } from '../../../contracts/stopped-at/stopped-at-contract';
import { StepFailureCaptureError } from '../../../errors/step-failure-capture/step-failure-capture-error';
import { WaitForCeilingHitError } from '../../../errors/wait-for-ceiling-hit/wait-for-ceiling-hit-error';
import { stepDispatchBroker } from '../../step/dispatch/step-dispatch-broker';

export const runExecuteStepLayerBroker = async ({
  lane,
  step,
  index,
  shotPath,
  lastShotPath,
  setLastShotPath,
}: {
  lane: LaneSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
}): Promise<{ reading: StepReading; stoppedAt: StoppedAt | null; timedOut: boolean }> => {
  const verb = stepVerbContract.parse(step.step);
  const serverLogStartByte = lane.serverLogLength();

  try {
    const reading = await stepDispatchBroker({
      lane,
      step,
      index,
      shotPath,
      lastShotPath,
      setLastShotPath,
    });

    if (reading.ok) {
      return { reading, stoppedAt: null, timedOut: false };
    }

    // The only way `stepDispatchBroker` returns ok: false without throwing is `expect: 'error'`
    // on a step that SUCCEEDED — the attack it was declared to land did not. That is itself a
    // finding, reported here rather than let pass silently, and it is never a ceiling hit.
    return {
      reading,
      stoppedAt: stoppedAtContract.parse({
        step: index,
        verb,
        error: contentTextContract.parse(
          `step ${String(index)} (${verb}) declared expect: 'error' but succeeded: ${reading.reading}`,
        ),
        candidates: [],
      }),
      timedOut: false,
    };
  } catch (error: unknown) {
    const nowMs = epochMsContract.parse(Date.now());
    // `stepDispatchBroker` wraps a real failure whose failure-path capture was actually attempted
    // in `StepFailureCaptureError`, carrying whether that specific `session.capture` call landed.
    // Unwrapped here, before anything else reads `error`, so the message extraction and the
    // timeout check below see the real rejection either way — whether it arrived wrapped or raw
    // (no capture was attempted: `shotPath` was null, or the verb was `'screenshot'`).
    const capturedShot = error instanceof StepFailureCaptureError ? error.captured : false;
    const capturedBlank = error instanceof StepFailureCaptureError ? error.blank : null;
    const capturedBlankColour = error instanceof StepFailureCaptureError ? error.blankColour : null;
    const capturedPixelChange = error instanceof StepFailureCaptureError ? error.pixelChange : null;
    const underlyingError =
      error instanceof StepFailureCaptureError ? error.underlyingError : error;
    // The error reaching here can be a raw, unwrapped Playwright rejection re-thrown unchanged by
    // `stepDispatchBroker` (when `step.expect` was not `'error'`) as well as this package's own
    // `WaitForCeilingHitError` or `BrowserStepUnsupportedError`. Playwright raises errors built by
    // Node's own internals outside the vm realm a Jest test file runs inside — `error instanceof
    // Error` reads false even though the value genuinely is one (error-is-native-error-adapter.ts's
    // header documents the same failure) — while `errorIsNativeErrorAdapter` answers correctly
    // whichever realm constructed the value, our own error classes included, since `isNativeError`
    // inspects the V8 error slot rather than the prototype chain. The `'message' in error` check is
    // what lets the property access typecheck, since the adapter call itself returns a plain
    // boolean and narrows nothing.
    const message = contentTextContract.parse(
      underlyingError !== null &&
        typeof underlyingError === 'object' &&
        errorIsNativeErrorAdapter({ value: underlyingError }) &&
        'message' in underlyingError
        ? String(underlyingError.message)
        : String(underlyingError),
    );
    const reading = stepReadingContract.parse({
      step: index,
      verb,
      node: step.node,
      ok: false,
      expected: step.expect,
      reading: message,
      shot: capturedShot ? shotPath : null,
      pixelChange: capturedPixelChange,
      blank: capturedBlank,
      blankColour: capturedBlankColour,
      serverWindow: serverLogWindowContract.parse({
        fromByte: serverLogStartByte,
        toByte: lane.serverLogLength(),
      }),
      startedAtMs: nowMs,
      endedAtMs: nowMs,
    });

    return {
      reading,
      stoppedAt: stoppedAtContract.parse({ step: index, verb, error: message, candidates: [] }),
      timedOut: underlyingError instanceof WaitForCeilingHitError,
    };
  }
};
