/**
 * PURPOSE: Routes one already browser-checked `Step` to its own verb broker, resolving a driving
 * step's handle — a `target` to exactly one element, or a `ref` to a live one — before it acts
 * (siegelense-tooling.md line 2109: "Nothing ever silently picks a match. Ambiguity is an ERROR").
 * Split out of `step-dispatch-broker.ts` because a nested function there is forbidden — this layer
 * is the whole "call the verb's broker" half of the dispatcher, leaving the parent to own the
 * browser guard and the `expect` inversion around this call.
 *
 * It takes the whole `LaneSession` rather than its `BrowserSession` because `seed` is the first
 * verb that needs no page — it reads the lane's own api port and throwaway home and touches no
 * screen — so the narrowing to a live browser happens BELOW that route rather than above it.
 * `until` routes here too, for the same reason: its `file` form also touches no page, so the
 * per-form browser narrowing for its other four forms lives inside `stepUntilBroker` itself.
 * `browserWindowStart` passes straight through to that one call and nowhere else — every other verb
 * below ignores it, since only `until`'s `console`/`response` forms scan a buffer at all.
 *
 * USAGE:
 * await runVerbLayerBroker({
 *   lane, step: StepStub({ step: 'click', target: SelectorStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: null, browserWindowStart: null, recordBinding,
 * });
 * // Resolves the target, clicks it, and returns the reading — or throws
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { RecipeResult } from '@dungeonmaster/siegelense-recipes/contracts';

import type { BufferLengths } from '../../../contracts/browser-session/browser-session-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { SeedBindingName } from '../../../contracts/seed-binding-name/seed-binding-name-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { stepVerbContract } from '../../../contracts/step-verb/step-verb-contract';
import { BrowserStepUnsupportedError } from '../../../errors/browser-step-unsupported/browser-step-unsupported-error';
import { isTargetingStepGuard } from '../../../guards/is-targeting-step/is-targeting-step-guard';
import { stepBoxBroker } from '../box/step-box-broker';
import { stepBeforeBroker } from '../before/step-before-broker';
import { stepClickBroker } from '../click/step-click-broker';
import { stepDomBroker } from '../dom/step-dom-broker';
import { stepEvalSourceBroker } from '../eval-source/step-eval-source-broker';
import { stepFileBroker } from '../file/step-file-broker';
import { stepGotoBroker } from '../goto/step-goto-broker';
import { stepHealthBroker } from '../health/step-health-broker';
import { stepHoldBroker } from '../hold/step-hold-broker';
import { stepKeyBroker } from '../key/step-key-broker';
import { stepLookBroker } from '../look/step-look-broker';
import { stepResizeBroker } from '../resize/step-resize-broker';
import { stepRequestBroker } from '../request/step-request-broker';
import { stepScreenshotBroker } from '../screenshot/step-screenshot-broker';
import { stepSeedBroker } from '../seed/step-seed-broker';
import { stepSnapshotBroker } from '../snapshot/step-snapshot-broker';
import { stepResetBroker } from '../reset/step-reset-broker';
import { stepStorageBroker } from '../storage/step-storage-broker';
import { stepPasteBroker } from '../paste/step-paste-broker';
import { stepTargetResolveBroker } from '../target-resolve/step-target-resolve-broker';
import { stepTypeBroker } from '../type/step-type-broker';
import { stepUntilBroker } from '../until/step-until-broker';
import { stepVideoBroker } from '../video/step-video-broker';
import { stepWaitForBroker } from '../wait-for/step-wait-for-broker';

export const runVerbLayerBroker = async ({
  lane,
  step,
  index,
  shotPath,
  browserWindowStart,
  recordBinding,
}: {
  lane: LaneSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
  browserWindowStart: BufferLengths | null;
  recordBinding: (params: { name: SeedBindingName; result: RecipeResult }) => void;
}): Promise<ContentText> => {
  // `seed` is routed FIRST, before the browser is narrowed, because it is the first verb that
  // touches no page: a recipe writes files and calls the lane's own API, so it runs identically
  // against `dungeonmaster-headless`. Its parameters are the step's own extra keys — the `seed`
  // member of `stepContract` is `.catchall()` rather than `.strict()` for exactly that — and
  // `recipeSeedRunBroker` is what grades them against the named recipe's manifest.
  if (step.step === 'seed') {
    // The known keys are peeled off so `parameters` holds exactly the recipe's own — the catchall
    // keys and nothing else. Each is named with a leading underscore because none is READ here:
    // the verb is already known, and `node`/`expect` belong to the dispatcher above.
    const { step: _verb, recipe, as, node: _node, expect: _expect, ...parameters } = step;
    return stepSeedBroker({ lane, recipe, parameters, as, recordBinding });
  }

  // `until` routes here for the same reason `seed` does: its `file` form touches disk and never
  // a page (R13), so `stepUntilBroker` takes the whole lane and narrows to a live browser itself,
  // per form, once it knows which of the five condition fields the step actually carries.
  if (step.step === 'until') {
    return stepUntilBroker({
      lane,
      visible: step.visible,
      response: step.response,
      file: step.file,
      predicate: step.predicate,
      console: step.console,
      timeoutMs: step.timeoutMs,
      browserWindowStart,
    });
  }

  // `request` routes here for the same reason `seed` does: it executes an HTTP request using
  // `fetchHttpRequestAdapter` against `lane.apiBaseUrl` and touches no page at all, so it runs
  // identically against browserless instances.
  if (step.step === 'request') {
    return stepRequestBroker({ lane, step });
  }

  // `file` routes here for the same reason `seed` and `request` do: it inspects or reads files
  // on disk in `lane.homePath` and touches no page at all, so it runs identically against
  // browserless instances.
  if (step.step === 'file') {
    return stepFileBroker({ lane, path: step.path });
  }

  // `snapshot` routes here for the same reason: it captures disk state in `lane.homePath`
  // and touches no page at all, so it runs identically against browserless instances.
  if (step.step === 'snapshot') {
    return stepSnapshotBroker({ lane, as: step.as });
  }

  // `reset` routes here for the same reason: its `state` and `instance` levels operate on disk
  // and process state and touch no page, so `stepResetBroker` takes the whole lane and narrows
  // to a live browser itself only when `level === 'page'`.
  if (step.step === 'reset') {
    return stepResetBroker({
      lane,
      level: step.level,
      to: step.to,
      reseed: step.reseed,
    });
  }

  const { browser: session } = lane;
  if (session === null) {
    // Every verb below drives or reads a live page. `stepDispatchBroker`'s own browser check has
    // already refused a browser verb against a browserless lane by name, so this narrows `session`
    // for the calls below and answers identically if that check is ever bypassed.
    throw new BrowserStepUnsupportedError({
      verb: stepVerbContract.parse(step.step),
      specName: lane.specName,
    });
  }

  if (
    isTargetingStepGuard({ step }) &&
    (step.step === 'waitFor' ||
      step.step === 'click' ||
      step.step === 'type' ||
      step.step === 'paste')
  ) {
    // `waitFor` takes no `ref`: `ElementHandle.waitForElementState` has no `attached`/`detached`,
    // which `locatorStateContract` carries, and a ref you already looked at is a poor subject for
    // "wait until this exists" anyway.
    await stepTargetResolveBroker({
      session,
      target: step.target,
      within: step.within,
      ref: step.step === 'waitFor' ? null : step.ref,
    });
  }

  if (step.step === 'goto') {
    return stepGotoBroker({ session, path: step.path });
  }
  if (step.step === 'look') {
    return stepLookBroker({ session, within: step.within });
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
      ref: step.ref,
      timeoutMs: step.timeoutMs,
    });
  }
  if (step.step === 'type') {
    return stepTypeBroker({
      session,
      target: step.target,
      within: step.within,
      ref: step.ref,
      value: step.value,
      timeoutMs: step.timeoutMs,
    });
  }
  if (step.step === 'paste') {
    return stepPasteBroker({
      session,
      target: step.target,
      within: step.within,
      ref: step.ref,
      filePath: step.filePath,
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
  if (step.step === 'box') {
    await stepTargetResolveBroker({
      session,
      target: null,
      within: null,
      ref: step.ref,
    });
    return stepBoxBroker({ session, ref: step.ref });
  }
  if (step.step === 'dom') {
    return stepDomBroker({
      session,
      target: step.target,
      fields: step.fields,
      text: step.text,
    });
  }
  if (step.step === 'key') {
    return stepKeyBroker({ session, press: step.press });
  }
  if (step.step === 'health') {
    return stepHealthBroker({
      lane,
      session,
      shotPath,
      browserWindowStart,
    });
  }
  if (step.step === 'hold') {
    return stepHoldBroker({
      lane,
      session,
      index,
      shotPath,
      frames: step.frames,
      everyMs: step.everyMs,
    });
  }
  if (step.step === 'resize') {
    return stepResizeBroker({ session, width: step.width, height: step.height });
  }
  if (step.step === 'before') {
    return stepBeforeBroker({ session, source: step.source });
  }
  if (step.step === 'storage') {
    return stepStorageBroker({ session, prefix: step.prefix });
  }
  if (step.step === 'video') {
    return stepVideoBroker({ session, action: step.action });
  }

  return stepEvalSourceBroker({ session, source: step.source });
};
