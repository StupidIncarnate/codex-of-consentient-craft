/**
 * PURPOSE: Routes one `Step` to its own verb broker, resolving a targeting step's `target` to
 * exactly one element first (siegelense-tooling.md line 1963: "Nothing ever silently picks a match.
 * Ambiguity is an ERROR"). Takes the whole `lane` rather than a bare `session`: `seed` runs on a
 * browserless lane and needs the lane's home path and base URL, neither of which a `BrowserSession`
 * carries. `seed` is checked and dispatched FIRST, before `lane.browser` is ever read, so the six
 * browser verbs behind it still narrow it to non-null exactly as before. Split out of
 * `step-dispatch-broker.ts` because a nested function there is forbidden — this layer is the whole
 * "call the verb's broker" half of the dispatcher, leaving the parent to own the browser guard and
 * the `expect` inversion around this call.
 *
 * USAGE:
 * await runVerbLayerBroker({
 *   lane, step: StepStub({ step: 'click', target: SelectorStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: null,
 * });
 * // Resolves the target, clicks it, and returns the reading — or throws
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { isTargetingStepGuard } from '../../../guards/is-targeting-step/is-targeting-step-guard';
import { stepClickBroker } from '../click/step-click-broker';
import { stepEvalSourceBroker } from '../eval-source/step-eval-source-broker';
import { stepGotoBroker } from '../goto/step-goto-broker';
import { stepScreenshotBroker } from '../screenshot/step-screenshot-broker';
import { stepSeedBroker } from '../seed/step-seed-broker';
import { stepTargetResolveBroker } from '../target-resolve/step-target-resolve-broker';
import { stepTypeBroker } from '../type/step-type-broker';
import { stepWaitForBroker } from '../wait-for/step-wait-for-broker';

export const runVerbLayerBroker = async ({
  lane,
  step,
  index,
  shotPath,
}: {
  lane: LaneSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
}): Promise<ContentText> => {
  if (step.step === 'seed') {
    return stepSeedBroker({ lane, step });
  }

  const session = lane.browser;
  if (session === null) {
    throw new Error(
      `run-verb-layer-broker: a '${step.step}' step (step ${String(index)}) reached with no session — the caller's browser guard should have already refused it`,
    );
  }

  if (
    isTargetingStepGuard({ step }) &&
    (step.step === 'waitFor' || step.step === 'click' || step.step === 'type')
  ) {
    const targetParams =
      step.within === null
        ? { session, target: step.target }
        : { session, target: step.target, within: step.within };
    await stepTargetResolveBroker(targetParams);
  }

  if (step.step === 'goto') {
    if (typeof step.path !== 'string') {
      throw new Error(
        `run-verb-layer-broker: a 'goto' step (step ${String(index)}) reached with an unresolved {step.row.field} reference — run-execute-broker must resolve every reference before a step dispatches`,
      );
    }
    return stepGotoBroker({ session, path: step.path });
  }
  if (step.step === 'waitFor') {
    return stepWaitForBroker({
      session,
      target: step.target,
      within: step.within,
      state: step.state,
      timeoutMs: step.timeoutMs,
    });
  }
  if (step.step === 'click') {
    return stepClickBroker({
      session,
      target: step.target,
      within: step.within,
      timeoutMs: step.timeoutMs,
    });
  }
  if (step.step === 'type') {
    return stepTypeBroker({
      session,
      target: step.target,
      within: step.within,
      value: step.value,
      timeoutMs: step.timeoutMs,
    });
  }
  if (step.step === 'screenshot') {
    if (shotPath === null) {
      throw new Error(
        `run-verb-layer-broker: a 'screenshot' step (step ${String(index)}) requires a non-null shotPath`,
      );
    }
    return stepScreenshotBroker({ session, filePath: shotPath });
  }

  return stepEvalSourceBroker({ session, source: step.source });
};
