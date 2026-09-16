/**
 * PURPOSE: Routes one already browser-checked `Step` to its own verb broker, resolving a targeting
 * step's `target` to exactly one element first (siegelense-tooling.md line 1963: "Nothing ever
 * silently picks a match. Ambiguity is an ERROR"). Split out of `step-dispatch-broker.ts` because a
 * nested function there is forbidden — this layer is the whole "call the verb's broker" half of the
 * dispatcher, leaving the parent to own the browser guard and the `expect` inversion around this
 * call.
 *
 * USAGE:
 * await runVerbLayerBroker({
 *   session, step: StepStub({ step: 'click', target: SelectorStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: null,
 * });
 * // Resolves the target, clicks it, and returns the reading — or throws
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { isTargetingStepGuard } from '../../../guards/is-targeting-step/is-targeting-step-guard';
import { stepClickBroker } from '../click/step-click-broker';
import { stepEvalSourceBroker } from '../eval-source/step-eval-source-broker';
import { stepGotoBroker } from '../goto/step-goto-broker';
import { stepScreenshotBroker } from '../screenshot/step-screenshot-broker';
import { stepTargetResolveBroker } from '../target-resolve/step-target-resolve-broker';
import { stepTypeBroker } from '../type/step-type-broker';
import { stepWaitForBroker } from '../wait-for/step-wait-for-broker';

export const runVerbLayerBroker = async ({
  session,
  step,
  index,
  shotPath,
}: {
  session: BrowserSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
}): Promise<ContentText> => {
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
