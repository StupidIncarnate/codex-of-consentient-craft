/**
 * PURPOSE: The one place a batch's `steps[]` entry becomes a `StepReading` — refuses a browser verb
 * against a browserless lane BY NAME (siegelense-tooling.md line 2154: "they go missing LOUDLY"),
 * delegates the resolve-then-act work to `run-verb-layer-broker.ts`, then inverts `ok` around
 * `expect` exactly once so no verb broker has to know the difference between an unexpected failure
 * and an attack that landed (chunk-02-driver-and-batch.md, W14: "That inversion belongs in the
 * dispatcher, once, not in six brokers"). `screenshot`, `health`, and `hold` are the verbs whose own brokers
 * already perform their capture with the caller-resolved `shotPath` as their `filePath`
 * (`run-verb-layer-broker.ts`), so this dispatcher's own unasked-capture step is skipped for them —
 * capturing again to the same path would be a second write of the same picture. A REAL failure
 * (`step.expect !== 'error'`) still captures before rethrowing — "always capture" (line 676) does not
 * stop being true because the step failed for a genuine reason rather than the one it declared; a
 * capture failure there is logged and swallowed rather than thrown, so it can never replace the
 * original error as what the caller sees. `browserWindowStart` passes straight through to
 * `runVerbLayerBroker` unchanged — this file never reads it itself, only carries `runExecuteBroker`'s
 * own run-start buffer lengths one layer further down, to the one verb (`until`) whose `console`/
 * `response` forms consult it. Whether that swallowed capture actually landed rides
 * upward on the rethrow anyway: `StepFailureCaptureError` wraps the original error with a `captured`
 * boolean, so `runExecuteStepLayerBroker` can build the failure `StepReading`'s `shot` from what THIS
 * call measured rather than a hardcoded `null` or a filesystem guess. When a step DID capture
 * (`shotPath` is non-null, on the success return, the `expect: 'error'` catch return, or a REAL
 * failure's catch return once ITS OWN capture lands — three branches now measure identically, since
 * `blank` is the one field in this design that is a VERDICT rather than a reading and a step failing
 * BECAUSE the page went white must say so on the single shot a fixer is most likely to open),
 * `blank`/`blankColour` come from `shotBlankReadBroker` and `pixelChange` from `shotChangeReadBroker`
 * against `lastShotPath()` — the caller's accessor onto the INSTANCE's last capture, never this
 * package's own `state/` (a broker's allowed imports do not include it; see
 * `driver-handle-request-broker.ts`'s own header for the identical constraint). `setLastShotPath` then
 * advances that pointer to THIS shot, so the next capture — this step, a later one, or the first of
 * the next run — compares against it. A step with no shot (`shotPath` is `null`), or a REAL failure
 * whose own capture never landed (`captured: false` — there is no file to measure or point at), leaves
 * all three `null` and never touches either accessor. On the REAL-failure branch a measurement failure
 * (a corrupt read, a dimension mismatch against `lastShotPath()`) degrades the same way rather than
 * throwing: an evidence read must never replace the step's own real error, the rule the swallowed
 * capture above already follows. `serverWindow` is real, read off `lane.serverLogLength()` before and
 * after the verb runs. `previousReading` is a fourth measurement taken alongside `blank` and
 * `pixelChange` rather than a fifth one bolted on: this file reads a `KeyListing` via
 * `session.look({ within: null })` ONCE, before `runVerbLayerBroker` runs, so every branch below diffs
 * the SAME before-snapshot rather than three independent reads racing the page. `delta` is
 * `elementDeltaComputeTransformer`'s answer between that snapshot and a second `session.look()` taken
 * after the verb — on the success return, on the `expect: 'error'` catch return, and attached to the
 * thrown `StepFailureCaptureError` on a real failure whose own capture landed, mirroring exactly where
 * `blank`/`pixelChange` are measured on each of those three paths. Both `previousReading` and `delta`
 * are `null` on a non-capturing step (no `session.look()` was ever taken to diff) and degrade to `null`
 * on their own read failure without disturbing anything else this file already measured or threw — an
 * evidence read must never replace the step's real outcome, the same rule the screenshot capture above
 * already follows.
 *
 * USAGE:
 * await stepDispatchBroker({
 *   lane, step: StepStub({ step: 'click', target: SelectorStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: AbsoluteFilePathStub({ value: '/repo/.../step3.png' }),
 *   browserWindowStart: null,
 *   lastShotPath: driverSessionState.lastShotPath, setLastShotPath: driverSessionState.setLastShotPath,
 * });
 * // Resolves the target, clicks it, captures to shotPath, measures it, and returns the stamped StepReading
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import type { BlankReading } from '../../../contracts/blank-reading/blank-reading-contract';
import type { BufferLengths } from '../../../contracts/browser-session/browser-session-contract';
import type { ElementDelta } from '../../../contracts/element-delta/element-delta-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { KeyListing } from '../../../contracts/key-listing/key-listing-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { SeedBindingName } from '../../../contracts/seed-binding-name/seed-binding-name-contract';
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
import { elementDeltaComputeTransformer } from '../../../transformers/element-delta-compute/element-delta-compute-transformer';
import { runVerbLayerBroker } from './run-verb-layer-broker';

export const stepDispatchBroker = async ({
  lane,
  step,
  index,
  shotPath,
  browserWindowStart,
  lastShotPath,
  setLastShotPath,
  recordBinding,
}: {
  lane: LaneSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
  browserWindowStart: BufferLengths | null;
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
  recordBinding: (params: { name: SeedBindingName; result: unknown }) => void;
}): Promise<StepReading> => {
  const verb = stepVerbContract.parse(step.step);

  if (isBrowserStepGuard({ verb }) && lane.browser === null) {
    throw new BrowserStepUnsupportedError({ verb, specName: lane.specName });
  }

  // NOT narrowed to a non-null browser here: `seed` is the first verb that touches no page, so a
  // browserless lane reaches `runVerbLayerBroker` and is refused THERE, below the seed route. Every
  // capture below is gated on this being non-null as well as on `shotPath`, which only a
  // `verbs.capturing` member ever gets — and every member of that list is a browser verb.
  const { browser: session } = lane;

  const startedAtMs = epochMsContract.parse(Date.now());
  const serverLogStartByte = lane.serverLogLength();

  // The element half of the pixel/element pair, taken ONCE before the verb runs so every branch
  // below diffs the same baseline. Null on a non-capturing step (mirrors pixelChange/blank staying
  // null there) and degrades to null on its own read failure rather than throwing — an evidence
  // read must never replace the step's real outcome.
  const previousReading: KeyListing | null =
    shotPath === null || session === null
      ? null
      : await session.look({ within: null }).catch((readError: unknown) => {
          process.stderr.write(
            `[step-dispatch] key listing read failed for step ${String(index)} before the verb ran: ${String(readError)}\n`,
          );
          return null;
        });

  // No mutable `ok`/`reading` declared ahead of the try: a placeholder initializer that every path
  // below unconditionally overwrites trips no-useless-assignment, so each branch instead builds and
  // returns its own complete StepReading directly.
  try {
    const reading = await runVerbLayerBroker({
      lane,
      step,
      index,
      shotPath,
      browserWindowStart,
      recordBinding,
    });
    const ok = step.expect !== 'error';

    if (
      shotPath !== null &&
      session !== null &&
      step.step !== 'screenshot' &&
      step.step !== 'health' &&
      step.step !== 'hold'
    ) {
      await session.capture({ filePath: shotPath });
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

    let delta: ElementDelta | null = null;
    if (previousReading !== null && session !== null) {
      try {
        const afterReading = await session.look({ within: null });
        delta = elementDeltaComputeTransformer({ before: previousReading, after: afterReading });
      } catch (readError: unknown) {
        process.stderr.write(
          `[step-dispatch] key listing read failed for step ${String(index)} after the verb ran: ${String(readError)}\n`,
        );
      }
    }

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
      previousReading,
      delta,
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
      if (
        shotPath !== null &&
        session !== null &&
        step.step !== 'screenshot' &&
        step.step !== 'health' &&
        step.step !== 'hold'
      ) {
        const captured = await session
          .capture({ filePath: shotPath })
          .then(() => true)
          .catch((captureError: unknown) => {
            process.stderr.write(
              `[step-dispatch] failure screenshot capture failed for step ${String(index)}: ${String(captureError)}\n`,
            );
            return false;
          });

        // Nothing to measure when the capture above never landed — mirrors the top-of-file
        // invariant that a step with no shot leaves all three readings null. When it DID land, this
        // measures exactly like the success path (same Promise.all, same blank/blankColour
        // derivation, same lastShotPath advance) so `blank` — the one VERDICT field in this design —
        // is never silently dropped on the single shot a fixer is most likely to open. A read
        // failure here (a corrupt PNG, a dimension mismatch against `lastShotPath()`) degrades to
        // `null` and is logged rather than thrown: it must never replace the step's own real error,
        // the same rule the capture above already follows.
        let blankReading: BlankReading | null = null;
        let pixelChange: PixelChange | null = null;
        if (captured) {
          try {
            const [measuredBlank, measuredChange] = await Promise.all([
              shotBlankReadBroker({ shotPath }),
              shotChangeReadBroker({ previousPath: lastShotPath(), currentPath: shotPath }),
            ]);
            blankReading = measuredBlank;
            pixelChange = measuredChange;
            setLastShotPath({ path: shotPath });
          } catch (readError: unknown) {
            process.stderr.write(
              `[step-dispatch] failure screenshot measurement failed for step ${String(index)}: ${String(readError)}\n`,
            );
          }
        }

        // The element half, gated on `captured` exactly like blank/pixelChange above: a failure
        // whose own capture never landed has nothing fresh to diff `previousReading` against either.
        let delta: ElementDelta | null = null;
        if (captured && previousReading !== null) {
          try {
            const afterReading = await session.look({ within: null });
            delta = elementDeltaComputeTransformer({
              before: previousReading,
              after: afterReading,
            });
          } catch (readError: unknown) {
            process.stderr.write(
              `[step-dispatch] key listing read failed for step ${String(index)} after a real failure's own capture: ${String(readError)}\n`,
            );
          }
        }

        throw new StepFailureCaptureError({
          underlyingError: error,
          captured,
          blank: blankReading === null ? null : blankReading.blank,
          blankColour: blankReading === null ? null : blankReading.colour,
          pixelChange,
          previousReading,
          delta,
        });
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

    if (
      shotPath !== null &&
      session !== null &&
      step.step !== 'screenshot' &&
      step.step !== 'health' &&
      step.step !== 'hold'
    ) {
      await session.capture({ filePath: shotPath });
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

    let delta: ElementDelta | null = null;
    if (previousReading !== null && session !== null) {
      try {
        const afterReading = await session.look({ within: null });
        delta = elementDeltaComputeTransformer({ before: previousReading, after: afterReading });
      } catch (readError: unknown) {
        process.stderr.write(
          `[step-dispatch] key listing read failed for step ${String(index)} after the verb ran: ${String(readError)}\n`,
        );
      }
    }

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
      previousReading,
      delta,
      serverWindow: serverLogWindowContract.parse({
        fromByte: serverLogStartByte,
        toByte: lane.serverLogLength(),
      }),
      startedAtMs,
      endedAtMs: epochMsContract.parse(Date.now()),
    });
  }
};
