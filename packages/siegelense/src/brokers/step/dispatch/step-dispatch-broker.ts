/**
 * PURPOSE: The one place a batch's `steps[]` entry becomes a `StepReading` — refuses a browser verb
 * against a browserless lane BY NAME (siegelense-tooling.md line 2154: "they go missing LOUDLY"),
 * delegates the resolve-then-act work to `run-verb-layer-broker.ts`, then inverts `ok` around
 * `expect` exactly once so no verb broker has to know the difference between an unexpected failure
 * and an attack that landed (chunk-02-driver-and-batch.md, W14: "That inversion belongs in the
 * dispatcher, once, not in six brokers"). `screenshot` is the one verb whose own broker already
 * performs its capture with the caller-resolved `shotPath` as its `filePath`
 * (`run-verb-layer-broker.ts`), so this dispatcher's own unasked-capture step is skipped for it —
 * capturing again to the same path would be a second write of the same picture.
 *
 * USAGE:
 * await stepDispatchBroker({
 *   lane, step: StepStub({ step: 'click', target: SelectorStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: AbsoluteFilePathStub({ value: '/repo/.../step3.png' }),
 * });
 * // Resolves the target, clicks it, captures to shotPath, and returns the stamped StepReading
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import { stepVerbContract } from '../../../contracts/step-verb/step-verb-contract';
import { BrowserStepUnsupportedError } from '../../../errors/browser-step-unsupported/browser-step-unsupported-error';
import { isBrowserStepGuard } from '../../../guards/is-browser-step/is-browser-step-guard';
import { runVerbLayerBroker } from './run-verb-layer-broker';

export const stepDispatchBroker = async ({
  lane,
  step,
  index,
  shotPath,
}: {
  lane: LaneSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
}): Promise<StepReading> => {
  const verb = stepVerbContract.parse(step.step);

  if (isBrowserStepGuard({ verb }) && lane.browser === null) {
    throw new BrowserStepUnsupportedError({ verb, specName: lane.specName });
  }

  const { browser: session } = lane;
  if (session === null) {
    // Every verb this chunk ships is a browser verb (stepStatics.verbs.browser), so the check above
    // always catches a browserless lane first. This narrows `session` for the call below.
    throw new BrowserStepUnsupportedError({ verb, specName: lane.specName });
  }

  const startedAtMs = epochMsContract.parse(Date.now());

  // No mutable `ok`/`reading` declared ahead of the try: a placeholder initializer that every path
  // below unconditionally overwrites trips no-useless-assignment, so each branch instead builds and
  // returns its own complete StepReading directly.
  try {
    const reading = await runVerbLayerBroker({ session, step, index, shotPath });
    const ok = step.expect !== 'error';

    if (shotPath !== null && step.step !== 'screenshot') {
      await session.capture({ filePath: shotPath });
    }

    return stepReadingContract.parse({
      step: index,
      verb,
      node: step.node,
      ok,
      expected: step.expect,
      reading,
      shot: shotPath,
      startedAtMs,
      endedAtMs: epochMsContract.parse(Date.now()),
    });
  } catch (error: unknown) {
    if (step.expect !== 'error') {
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
      await session.capture({ filePath: shotPath });
    }

    return stepReadingContract.parse({
      step: index,
      verb,
      node: step.node,
      ok: true,
      expected: step.expect,
      reading,
      shot: shotPath,
      startedAtMs,
      endedAtMs: epochMsContract.parse(Date.now()),
    });
  }
};
