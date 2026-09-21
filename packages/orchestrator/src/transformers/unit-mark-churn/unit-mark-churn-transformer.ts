/**
 * PURPOSE: A unit's whole history — every work item that was ASSIGNED it, oldest first, with what
 * that session said about it. Reach for this over `unitCurrentMarkTransformer` when you want to read
 * how a unit got where it is rather than only where it is.
 *
 * ASSIGNMENT is the key, not the mark: a work item that was handed the unit and died without marking
 * it has no observation for it, so a walk over the observations alone cannot see it at all and
 * silently loses the one row this surface exists to show. Such a row is emitted with explicit nulls.
 *
 * USAGE:
 * unitMarkChurnTransformer({ quest, unitId });
 * // Returns: UnitMarkChurnEntry[], oldest first
 */

import type { Quest, UnitId } from '@dungeonmaster/shared/contracts';

import { unitMarkChurnEntryContract } from '../../contracts/unit-mark-churn-entry/unit-mark-churn-entry-contract';
import type { UnitMarkChurnEntry } from '../../contracts/unit-mark-churn-entry/unit-mark-churn-entry-contract';
import { workItemAssignmentContract } from '../../contracts/work-item-assignment/work-item-assignment-contract';

export const unitMarkChurnTransformer = ({
  quest,
  unitId,
}: {
  quest: Quest;
  unitId: UnitId;
}): UnitMarkChurnEntry[] =>
  quest.workItems
    // The UNION of the two reads, never one of them. `payload.units[]` is what the router forecast;
    // the observations cover every work item already on disk, every chat role, and anything minted
    // before the router wrote payloads — and a session that marked a unit it was not handed still
    // marked it.
    .filter((workItem) => {
      const assignment = workItemAssignmentContract.safeParse(workItem.payload);

      return (
        (assignment.success && assignment.data.units.some((unit) => unit.unitId === unitId)) ||
        workItem.observations.some((observation) => observation.unitId === unitId)
      );
    })
    // ARRAY order, never `createdAt`. Every mint path spreads and appends and nothing re-orders,
    // while a parallel batch is minted inside one persist and shares a timestamp — so a sort over it
    // is unstable and the walk's order becomes whichever way the engine happened to compare.
    .map((workItem) => {
      const observation = workItem.observations.find((entry) => entry.unitId === unitId);

      return unitMarkChurnEntryContract.parse({
        workItemId: workItem.id,
        step: workItem.step ?? null,
        mark: observation?.mark ?? null,
        evidence: observation?.evidence ?? null,
        toSettle: observation?.toSettle ?? null,
        // A crashed session left no observation to take a time from, and a row with no time cannot
        // be placed in the sequence.
        at: observation?.at ?? workItem.completedAt ?? workItem.createdAt,
      });
    });
