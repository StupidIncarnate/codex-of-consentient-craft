/**
 * PURPOSE: `quest-work`'s `outcome` payload, surfaced through `deriveOutcomeTransformer` (story 13):
 * accepted only where the work item's marks agree with the declared word or it holds no units at
 * all, refused with a `quest-work:`-prefixed message naming every unit that contradicts the
 * declaration otherwise. `done` is a fact about the record, never a claim the caller gets to make.
 *
 * USAGE:
 * questWorkOutcomeDeriveTransformer({ workItem: WorkItemStub({ assignedUnitIds: [] }), word: StepOutcomeStub({ value: 'done' }) });
 * // Returns 'done'
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import { deriveOutcomeTransformer } from '../derive-outcome/derive-outcome-transformer';

export const questWorkOutcomeDeriveTransformer = ({
  workItem,
  word,
}: {
  workItem: WorkItem;
  word: StepOutcome;
}): StepOutcome => {
  try {
    return deriveOutcomeTransformer({
      assignedUnitIds: workItem.assignedUnitIds,
      observations: workItem.observations,
      declaredWord: word,
      hitWall: word === 'wall',
    });
  } catch {
    const markByUnitId = new Map(
      workItem.observations.map((observation) => [String(observation.unitId), observation.mark]),
    );
    const contradicting = workItem.assignedUnitIds.filter((unitId) => {
      const mark = markByUnitId.get(String(unitId));
      return mark === undefined || mark === 'unmet';
    });

    throw new Error(
      [
        `quest-work: work item ${String(workItem.id)} is assigned ${String(workItem.assignedUnitIds.length)} unit(s), so its outcome is DERIVED from its marks and`,
        `cannot be declared. These units contradict \`${word}\`:`,
        ...contradicting.map((unitId) => `  ${String(unitId)}`),
        'Mark each one through `observations` and signal — the router reads the record. Nothing was recorded.',
      ].join('\n'),
    );
  }
};
