/**
 * PURPOSE: Runs ONE step through `stepDispatchBroker` and turns whatever comes back into a pair the
 * parent's loop can act on uniformly: a `StepReading` for the transcript, and — only when that
 * reading is a failure — the `StoppedAt` describing it. Split out of `run-execute-broker.ts` because
 * it is the one place an UNCAUGHT exception (a step whose own broker threw because `expect` was not
 * `'error'`) is caught rather than left to crash the batch: "a step's failure is CAUGHT and recorded
 * as a reading, which is different from swallowing" — the exception becomes an `ok: false` reading
 * exactly like the dispatcher's own `expect: 'error'`-but-succeeded finding, so the parent's `stopOn`
 * check never has to know which of the two produced it. A timeout is one of the shapes this catches:
 * "a timeout must NAME the step" (siegelense-tooling.md line 101) is satisfied here, since `step` and
 * `verb` are known at the call site even when the underlying error carries neither.
 *
 * USAGE:
 * await runExecuteStepLayerBroker({
 *   lane, step: StepStub({ step: 'goto', path: UrlPathStub() }),
 *   index: StepIndexStub({ value: 3 }), shotPath: null,
 * });
 * // Returns { reading, stoppedAt: null } on success, or { reading, stoppedAt } once ok is false
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StepIndex } from '../../../contracts/step-index/step-index-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import type { StepReading } from '../../../contracts/step-reading/step-reading-contract';
import { stepVerbContract } from '../../../contracts/step-verb/step-verb-contract';
import { stoppedAtContract } from '../../../contracts/stopped-at/stopped-at-contract';
import type { StoppedAt } from '../../../contracts/stopped-at/stopped-at-contract';
import { stepDispatchBroker } from '../../step/dispatch/step-dispatch-broker';

export const runExecuteStepLayerBroker = async ({
  lane,
  step,
  index,
  shotPath,
}: {
  lane: LaneSession;
  step: Step;
  index: StepIndex;
  shotPath: AbsoluteFilePath | null;
}): Promise<{ reading: StepReading; stoppedAt: StoppedAt | null }> => {
  const verb = stepVerbContract.parse(step.step);

  try {
    const reading = await stepDispatchBroker({ lane, step, index, shotPath });

    if (reading.ok) {
      return { reading, stoppedAt: null };
    }

    // The only way `stepDispatchBroker` returns ok: false without throwing is `expect: 'error'`
    // on a step that SUCCEEDED — the attack it was declared to land did not. That is itself a
    // finding, reported here rather than let pass silently.
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
    };
  } catch (error: unknown) {
    const nowMs = epochMsContract.parse(Date.now());
    const message = contentTextContract.parse(
      error instanceof Error ? error.message : String(error),
    );
    const reading = stepReadingContract.parse({
      step: index,
      verb,
      node: step.node,
      ok: false,
      expected: step.expect,
      reading: message,
      shot: null,
      startedAtMs: nowMs,
      endedAtMs: nowMs,
    });

    return {
      reading,
      stoppedAt: stoppedAtContract.parse({ step: index, verb, error: message, candidates: [] }),
    };
  }
};
