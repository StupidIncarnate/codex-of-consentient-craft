/**
 * PURPOSE: The one place a batch's `steps[]` entry becomes a `StepReading` — refuses a browser verb
 * against a browserless lane BY NAME (siegelense-tooling.md line 2154: "they go missing LOUDLY"),
 * delegates the resolve-then-act work to `run-verb-layer-broker.ts`, then inverts `ok` around
 * `expect` exactly once so no verb broker has to know the difference between an unexpected failure
 * and an attack that landed (chunk-02-driver-and-batch.md, W14: "That inversion belongs in the
 * dispatcher, once, not in six brokers"). `screenshot` is the one verb whose own broker already
 * performs its capture with the caller-resolved `shotPath` as its `filePath`
 * (`run-verb-layer-broker.ts`), so this dispatcher's own unasked-capture step is skipped for it —
 * capturing again to the same path would be a second write of the same picture. A REAL failure
 * (`step.expect !== 'error'`) still captures before rethrowing — "always capture" (line 676) does not
 * stop being true because the step failed for a genuine reason rather than the one it declared; a
 * capture failure there is logged and swallowed rather than thrown, so it can never replace the
 * original error as what the caller sees. Whether that swallowed capture actually landed rides
 * upward on the rethrow anyway: `StepFailureCaptureError` wraps the original error with a `captured`
 * boolean, so `runExecuteStepLayerBroker` can build the failure `StepReading`'s `shot` from what THIS
 * call measured rather than a hardcoded `null` or a filesystem guess. When a step DID capture (`shotPath` is non-null, on either
 * the success return or the `expect: 'error'` catch return — chunk 2's own history records a failed
 * step that never captured as a defect, so both branches measure identically), `blank`/`blankColour`
 * come from `shotBlankReadBroker` and `pixelChange` from `shotChangeReadBroker` against
 * `lastShotPath()` — the caller's accessor onto the INSTANCE's last capture, never this package's own
 * `state/` (a broker's allowed imports do not include it; see `driver-handle-request-broker.ts`'s own
 * header for the identical constraint). `setLastShotPath` then advances that pointer to THIS shot, so
 * the next capture — this step, a later one, or the first of the next run — compares against it. A
 * step with no shot (`shotPath` is `null`) leaves all three `null` and never touches either accessor.
 * `serverWindow` is real, read off `lane.serverLogLength()` before and after the verb runs.
 *
 * USAGE:
 * await stepDispatchBroker({
 *   lane, step: StepStub({ step: 'click', target: SelectorStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: AbsoluteFilePathStub({ value: '/repo/.../step3.png' }),
 *   lastShotPath: driverSessionState.lastShotPath, setLastShotPath: driverSessionState.setLastShotPath,
 * });
 * // Resolves the target, clicks it, captures to shotPath, measures it, and returns the stamped StepReading
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import type { BlankReading } from '../../../contracts/blank-reading/blank-reading-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { PixelChange } from '../../../contracts/pixel-change/pixel-change-contract';
import { serverLogWindowContract } from '../../../contracts/server-log-window/server-log-window-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import { stepVerbContract } from '../../../contracts/step-verb/step-verb-contract';
import { BrowserStepUnsupportedError } from '../../../errors/browser-step-unsupported/browser-step-unsupported-error';
import { StepFailureCaptureError } from '../../../errors/step-failure-capture/step-failure-capture-error';
import { isBrowserStepGuard } from '../../../guards/is-browser-step/is-browser-step-guard';
import { shotBlankReadBroker } from '../../shot/blank-read/shot-blank-read-broker';
import { shotChangeReadBroker } from '../../shot/change-read/shot-change-read-broker';
import { runVerbLayerBroker } from './run-verb-layer-broker';

export const stepDispatchBroker = async ({
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
}): Promise<StepReading> => {
  const verb = stepVerbContract.parse(step.step);

  if (isBrowserStepGuard({ verb }) && lane.browser === null) {
    throw new BrowserStepUnsupportedError({ verb, specName: lane.specName });
  }

  const startedAtMs = epochMsContract.parse(Date.now());
  const serverLogStartByte = lane.serverLogLength();

  // No mutable `ok`/`reading` declared ahead of the try: a placeholder initializer that every path
  // below unconditionally overwrites trips no-useless-assignment, so each branch instead builds and
  // returns its own complete StepReading directly.
  try {
    const reading = await runVerbLayerBroker({ lane, step, index, shotPath });
    const ok = step.expect !== 'error';

    if (shotPath !== null && step.step !== 'screenshot') {
      // A non-null shotPath only ever reaches a non-`screenshot` step for one of `verbs.acting`
      // (all three are browser verbs), so the guard above has already refused a null `lane.browser`
      // for this call — this is TypeScript's narrowing, not a new runtime possibility.
      const captureSession = lane.browser;
      if (captureSession === null) {
        throw new Error(
          `step-dispatch-broker: step ${String(index)} needs a browser session to capture a shot, but the lane has none`,
        );
      }
      await captureSession.capture({ filePath: shotPath });
    }

    let blankReading: BlankReading | null = null;
    let pixelChange: PixelChange | null = null;
    if (shotPath !== null) {
      const [measuredBlank, measuredChange] = await Promise.all([
        shotBlankReadBroker({ shotPath }),
        shotChangeReadBroker({ previousPath: lastShotPath(), currentPath: shotPath }),
      ]);
      blankReading = measuredBlank;
      pixelChange = measuredChange;
      setLastShotPath({ path: shotPath });
    }
    const blank = blankReading === null ? null : blankReading.blank;
    const blankColour = blankReading === null ? null : blankReading.colour;

    return stepReadingContract.parse({
      step: index,
      verb,
      node: step.node,
      ok,
      expected: step.expect,
      reading,
      shot: shotPath,
      pixelChange,
      blank,
      blankColour,
      serverWindow: serverLogWindowContract.parse({
        fromByte: serverLogStartByte,
        toByte: lane.serverLogLength(),
      }),
      startedAtMs,
      endedAtMs: epochMsContract.parse(Date.now()),
    });
  } catch (error: unknown) {
    if (step.expect !== 'error') {
      // A step that fails for a REAL reason still gets its evidence captured — "always capture"
      // (siegelense-tooling.md line 676) does not stop being true because the failure was
      // unexpected rather than declared. A capture failure here is logged and swallowed, never
      // thrown: replacing the step's own error with a screenshot-adapter error would hide the
      // defect the walk actually hit. Whether it landed is not knowable from outside this swallowed
      // `.catch`, so it rides upward on the rethrow instead: `StepFailureCaptureError` carries both
      // the original error and a `captured` boolean, so `runExecuteStepLayerBroker` reports `shot`
      // honestly rather than hardcoding `null` or guessing from the filesystem.
      if (shotPath !== null && step.step !== 'screenshot') {
        const captureSession = lane.browser;
        if (captureSession === null) {
          throw new Error(
            `step-dispatch-broker: step ${String(index)} needs a browser session to capture a shot, but the lane has none`,
            { cause: error },
          );
        }
        const captured = await captureSession
          .capture({ filePath: shotPath })
          .then(() => true)
          .catch((captureError: unknown) => {
            process.stderr.write(
              `[step-dispatch] failure screenshot capture failed for step ${String(index)}: ${String(captureError)}\n`,
            );
            return false;
          });
        throw new StepFailureCaptureError({ underlyingError: error, captured });
      }
      throw error;
    }

    // `runVerbLayerBroker` drives Playwright directly against the resolved target, and Playwright
    // raises errors built by Node's own internals outside the vm realm a Jest test file runs
    // inside — `error instanceof Error` reads false even though the value genuinely is one
    // (error-is-native-error-adapter.ts's header documents the same failure).
    // `errorIsNativeErrorAdapter` checks the V8-internal error slot instead, answering correctly
    // whichever realm constructed the value; the `'message' in error` check is what lets the
    // property access typecheck, since the adapter call itself returns a plain boolean and
    // narrows nothing.
    const reading: ContentText = contentTextContract.parse(
      error !== null &&
        typeof error === 'object' &&
        errorIsNativeErrorAdapter({ value: error }) &&
        'message' in error
        ? String(error.message)
        : String(error),
    );

    if (shotPath !== null && step.step !== 'screenshot') {
      const captureSession = lane.browser;
      if (captureSession === null) {
        throw new Error(
          `step-dispatch-broker: step ${String(index)} needs a browser session to capture a shot, but the lane has none`,
          { cause: error },
        );
      }
      await captureSession.capture({ filePath: shotPath });
    }

    let blankReading: BlankReading | null = null;
    let pixelChange: PixelChange | null = null;
    if (shotPath !== null) {
      const [measuredBlank, measuredChange] = await Promise.all([
        shotBlankReadBroker({ shotPath }),
        shotChangeReadBroker({ previousPath: lastShotPath(), currentPath: shotPath }),
      ]);
      blankReading = measuredBlank;
      pixelChange = measuredChange;
      setLastShotPath({ path: shotPath });
    }
    const blank = blankReading === null ? null : blankReading.blank;
    const blankColour = blankReading === null ? null : blankReading.colour;

    return stepReadingContract.parse({
      step: index,
      verb,
      node: step.node,
      ok: true,
      expected: step.expect,
      reading,
      shot: shotPath,
      pixelChange,
      blank,
      blankColour,
      serverWindow: serverLogWindowContract.parse({
        fromByte: serverLogStartByte,
        toByte: lane.serverLogLength(),
      }),
      startedAtMs,
      endedAtMs: epochMsContract.parse(Date.now()),
    });
  }
};
