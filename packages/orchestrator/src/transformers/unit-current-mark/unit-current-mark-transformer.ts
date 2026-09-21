/**
 * PURPOSE: A unit's state right now — the observation on the most recent work item that was ASSIGNED
 * it, or `null` where it is outstanding. Reach for this over `unitMarkChurnTransformer` when you want
 * the one current answer rather than every session that ever held the unit.
 *
 * ASSIGNMENT is the key, not the mark. The two readings agree on every happy path and diverge on a
 * session that was handed the unit and died without marking it: that unit reads as outstanding here
 * and gets re-minted, where "the most recent mark anywhere" would read it as whatever the last
 * completed session said and make the crash invisible.
 *
 * USAGE:
 * unitCurrentMarkTransformer({ quest, unitId });
 * // Returns: UnitCurrentMark, or null
 *
 * `null` in two cases, and NEITHER is an error — both read as outstanding: no work item was ever
 * assigned this unit, or the most recent one that was holds no observation for it.
 */

import type { Quest, UnitId } from '@dungeonmaster/shared/contracts';

import { unitCurrentMarkContract } from '../../contracts/unit-current-mark/unit-current-mark-contract';
import type { UnitCurrentMark } from '../../contracts/unit-current-mark/unit-current-mark-contract';
import { workItemAssignmentContract } from '../../contracts/work-item-assignment/work-item-assignment-contract';

export const unitCurrentMarkTransformer = ({
  quest,
  unitId,
}: {
  quest: Quest;
  unitId: UnitId;
}): UnitCurrentMark | null => {
  // The UNION of the two reads, never one of them. `payload.units[]` is what the router forecast;
  // the observations cover every work item already on disk, every chat role, and anything minted
  // before the router wrote payloads — and a session that marked a unit it was not handed still
  // marked it.
  const assigned = quest.workItems.filter((workItem) => {
    const assignment = workItemAssignmentContract.safeParse(workItem.payload);

    return (
      (assignment.success && assignment.data.units.some((unit) => unit.unitId === unitId)) ||
      workItem.observations.some((observation) => observation.unitId === unitId)
    );
  });

  // ARRAY order, never `createdAt`. Every mint path spreads and appends and nothing re-orders, while
  // a parallel batch is minted inside one persist and shares a timestamp — so a sort over it is
  // unstable and "most recent" becomes whichever way the engine happened to compare.
  const latest = assigned.at(-1);

  if (latest === undefined) {
    return null;
  }

  const observation = latest.observations.find((entry) => entry.unitId === unitId);

  if (observation === undefined) {
    return null;
  }

  return unitCurrentMarkContract.parse({
    ...observation,
    workItemId: latest.id,
    ...(latest.step === undefined ? {} : { step: latest.step }),
  });
};
