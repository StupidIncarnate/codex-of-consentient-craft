/**
 * PURPOSE: Every unit a work item was ASSIGNED, paired with its current mark — read off
 * `workItem.observations` where one exists, `unmarked` otherwise. Order follows `assignedUnitIds`,
 * not `observations`: an in-progress work item's observations are a strict subset of what it will
 * eventually record, and a unit missing from that subset is still owed a row, not absent from one.
 *
 * USAGE:
 * workItemUnitMarksTransformer({ workItem });
 * // Returns one UnitMarkReadout per workItem.assignedUnitIds entry, in that array's own order
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { unitMarkReadoutContract } from '../../contracts/unit-mark-readout/unit-mark-readout-contract';
import type { UnitMarkReadout } from '../../contracts/unit-mark-readout/unit-mark-readout-contract';

export const workItemUnitMarksTransformer = ({
  workItem,
}: {
  workItem: WorkItem | undefined;
}): UnitMarkReadout[] => {
  const markByUnitId = new Map(
    (workItem?.observations ?? []).map((observation) => [observation.unitId, observation.mark]),
  );
  return (workItem?.assignedUnitIds ?? []).map((unitId) =>
    unitMarkReadoutContract.parse({ unitId, mark: markByUnitId.get(unitId) ?? 'unmarked' }),
  );
};
