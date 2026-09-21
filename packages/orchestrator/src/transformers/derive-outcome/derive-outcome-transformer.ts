/**
 * PURPOSE: The one word a step's outcome derives to — `done` is a fact about the record, not a claim
 * an agent gets to make. The wall is checked FIRST, ahead of both throws below: an environment wall
 * is a fact about the machine and is still true even where the record it interrupted is incomplete.
 *
 * USAGE:
 * deriveOutcomeTransformer({
 *   assignedUnitIds: [unitId],
 *   observations: [UnitObservationStub({ unitId, mark: 'met' })],
 *   hitWall: false,
 * });
 * // Returns: 'done'
 *
 * `declaredWord` is legal ONLY where `assignedUnitIds` is empty — a planner, a `repair`, a
 * `warpgate` merge, or an adversarial piece allocated no family, where there is nothing for the
 * record to settle. A step holding units throws on a `declaredWord` even where the record AGREES
 * with it — the rule is structural, never a check for whether the guess happened to be right.
 */

import type { UnitId, UnitMark, UnitObservation } from '@dungeonmaster/shared/contracts';

import { stepOutcomeContract } from '../../contracts/step-outcome/step-outcome-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';

export const deriveOutcomeTransformer = ({
  assignedUnitIds,
  observations,
  declaredWord,
  hitWall,
}: {
  assignedUnitIds: readonly UnitId[];
  observations: readonly UnitObservation[];
  declaredWord?: StepOutcome;
  hitWall: boolean;
}): StepOutcome => {
  if (hitWall) {
    return stepOutcomeContract.parse('wall');
  }

  if (assignedUnitIds.length === 0) {
    if (declaredWord !== undefined) {
      return declaredWord;
    }
    throw new Error(
      `deriveOutcomeTransformer: no units were assigned and no declaredWord was given. A step holding no units is the one case that declares its own outcome — pass one of ${stepOutcomeContract.options.join(' | ')}.`,
    );
  }

  // The unit's MOST RECENT mark in `observations`, by ARRAY ORDER — a later entry for the same
  // unit overwrites an earlier one in the Map, never `at`. Mirrors `unitCurrentMarkTransformer`'s
  // own "array order, never createdAt" rule: a parallel batch can share one timestamp.
  const markByUnitId = new Map<UnitId, UnitMark>();
  for (const observation of observations) {
    markByUnitId.set(observation.unitId, observation.mark);
  }

  // Neither `met` nor `cant-meet` settles it — the unmarked units and the `unmet` ones together,
  // because both shapes make a `done` false and a reader of the throw below needs both.
  const contradicting = assignedUnitIds.filter((unitId) => {
    const mark = markByUnitId.get(unitId);
    return mark === undefined || mark === 'unmet';
  });

  const derived = stepOutcomeContract.parse(contradicting.length === 0 ? 'done' : 'unmet');

  if (declaredWord !== undefined) {
    throw new Error(
      `deriveOutcomeTransformer: declaredWord '${declaredWord}' was given alongside ${String(assignedUnitIds.length)} assigned units, which derive '${derived}'. A step that holds units does not declare its outcome — the record does. Unsettled units: ${contradicting.length === 0 ? 'none' : contradicting.join(', ')}. Mark every unit met or cant-meet and drop declaredWord.`,
    );
  }

  return derived;
};
