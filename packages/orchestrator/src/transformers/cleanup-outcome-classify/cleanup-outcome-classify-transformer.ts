/**
 * PURPOSE: Classifies a `cleanup` answer into `done` (anything was touched) or `empty` (nothing
 * was stale and nothing leaked — the normal `sweepIn` on a clean machine). `leftAlone` never
 * decides the word: a live instance somebody else owns is not this pass's business, so it plays no
 * part in the classification either way.
 *
 * USAGE:
 * cleanupOutcomeClassifyTransformer({ answer: CleanupAnswerStub() });
 * // Returns 'empty' — every field at zero
 *
 * cleanupOutcomeClassifyTransformer({ answer: CleanupAnswerStub({ lockReleased: true }) });
 * // Returns 'done'
 */

import { stepOutcomeContract } from '../../contracts/step-outcome/step-outcome-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import type { CleanupAnswer } from '../../contracts/cleanup-answer/cleanup-answer-contract';

export const cleanupOutcomeClassifyTransformer = ({
  answer,
}: {
  answer: CleanupAnswer;
}): StepOutcome => {
  const touchedSomething =
    answer.reaped.length > 0 ||
    answer.portsReleased.length > 0 ||
    answer.lockReleased ||
    answer.assetsAged.instances > 0;

  return stepOutcomeContract.parse(touchedSomething ? 'done' : 'empty');
};
