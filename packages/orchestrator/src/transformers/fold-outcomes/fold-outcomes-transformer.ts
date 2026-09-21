/**
 * PURPOSE: One step's outcome across however many pieces ran it, worst first, per
 * `stepOutcomeContract.options`'s own declared order. This is a PER-STEP fold, never a per-batch
 * one — a step's pieces can run across several batches, and every piece at that step folds into
 * that step's own outcome and takes that step's own routes. Fold across a mixed batch instead and
 * an adversarial `unmet` lands at a route that never measured it.
 *
 * USAGE:
 * foldOutcomesTransformer({ outcomes: ['done', 'unmet', 'done'] });
 * // Returns: 'unmet'
 *
 * An empty array is a step whose pieces all drained to nothing — `empty` is the identity of this
 * worst-first fold, and returning it rather than throwing keeps the router on a legal state.
 */

import { stepOutcomeContract } from '../../contracts/step-outcome/step-outcome-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';

export const foldOutcomesTransformer = ({
  outcomes,
}: {
  outcomes: readonly StepOutcome[];
}): StepOutcome => {
  if (outcomes.length === 0) {
    return stepOutcomeContract.parse('empty');
  }

  // `stepOutcomeContract.options` IS the precedence order — the first one present in `outcomes`
  // is the worst. Every outcome in a non-empty array is one of the four, so this always finds one.
  const worst = stepOutcomeContract.options.find((candidate) => outcomes.includes(candidate));

  return stepOutcomeContract.parse(worst ?? 'empty');
};
