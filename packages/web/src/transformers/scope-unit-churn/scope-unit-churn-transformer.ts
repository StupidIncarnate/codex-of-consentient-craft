/**
 * PURPOSE: The churn sequence for every unit two or more of a scope's work items marked — the
 * per-unit readout `execution-row-unit-marks` cannot show, because a single work item's own
 * observations never span more than one dispatch. Reads each work item's `observations` in the
 * CALLER's array order, so a scope's own work-item order decides the sequence, matching the same
 * order `ExecutionPanelWidget` already renders those rows in.
 *
 * USAGE:
 * scopeUnitChurnTransformer({ workItems: scopeWorkItems });
 * // Returns one UnitChurn per unit two-or-more `workItems` recorded an observation for, dropped
 * // entirely when only one (or zero) ever touched it — see unitChurnContract's own min() for why
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import type { UnitId } from '@dungeonmaster/shared/contracts';

import { displayLabelContract } from '../../contracts/display-label/display-label-contract';
import { unitChurnContract } from '../../contracts/unit-churn/unit-churn-contract';
import type { UnitChurn } from '../../contracts/unit-churn/unit-churn-contract';
import { unitChurnStepContract } from '../../contracts/unit-churn-step/unit-churn-step-contract';
import type { UnitChurnStep } from '../../contracts/unit-churn-step/unit-churn-step-contract';

export const scopeUnitChurnTransformer = ({
  workItems,
}: {
  workItems: readonly WorkItem[];
}): UnitChurn[] => {
  const stepsByUnitId = new Map<UnitId, UnitChurnStep[]>();
  const unitIdOrder: UnitId[] = [];

  workItems.forEach((workItem) => {
    const workItemLabel = displayLabelContract.parse(workItem.step ?? workItem.role);
    workItem.observations.forEach((observation) => {
      const step = unitChurnStepContract.parse({ mark: observation.mark, workItemLabel });
      const existing = stepsByUnitId.get(observation.unitId);
      if (existing) {
        existing.push(step);
        return;
      }
      stepsByUnitId.set(observation.unitId, [step]);
      unitIdOrder.push(observation.unitId);
    });
  });

  return unitIdOrder.reduce<UnitChurn[]>((churns, unitId) => {
    // safeParse, not a length check against a duplicated threshold — unitChurnContract's own
    // min() is the single place "how many marks make it churn" is defined.
    const parsed = unitChurnContract.safeParse({ unitId, marks: stepsByUnitId.get(unitId) });
    if (parsed.success) {
      churns.push(parsed.data);
    }
    return churns;
  }, []);
};
