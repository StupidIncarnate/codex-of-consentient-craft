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

import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import type { CleanupCliAnswer } from '../../contracts/cleanup-answer/cleanup-answer-contract';

export const cleanupOutcomeClassifyTransformer = ({
  answer,
}: {
  answer: CleanupCliAnswer;
}): StepOutcome => {
  const touchedSomething =
    answer.reaped.length > 0 ||
    answer.portsReleased.length > 0 ||
    answer.lockReleased ||
    answer.assetsAged.instances > 0;

  return touchedSomething ? 'done' : 'empty';
};
