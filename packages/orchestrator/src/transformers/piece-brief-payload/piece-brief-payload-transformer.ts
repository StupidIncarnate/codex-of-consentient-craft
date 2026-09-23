/**
 * PURPOSE: The brief a work item carries when it has no piece of its own — the ORIGINATING piece's
 * payload, copied and narrowed to the units actually being minted, with the piece's human `pieceName`
 * always stamped onto it. Reach for this over reading `piece.payload` directly whenever the payload
 * is about to land on a work item: a raw copy carries a unit list belonging to a different session,
 * an instance id that is stale the moment it is read, and no name at all.
 *
 * USAGE:
 * pieceBriefPayloadTransformer({ piece, unitIds: [unitId] });
 * // Returns: the piece's payload with `units[]` narrowed to `unitIds` and `pieceName` carried on
 *
 * `pieceName` IS ALWAYS PRESENT ON THE RETURN, because `workPlanPieceContract` requires it on every
 * piece — this is the ONE key this transformer adds rather than merely copies, since it lives on the
 * piece itself, not inside `piece.payload`. It is what the execution panel reads
 * (`execution-work-item-row-layer-widget.tsx`'s `payload?.pieceName`) to label a step's rows as
 * `step - pieceName` once a scope holds more than one piece at that step.
 *
 * `'units' in carried`, NEVER `safeParse` SUCCESS ALONE. `workItemAssignmentContract.units` carries
 * `.default([])`, so a siegemaster payload — `{ path, offMapFamily }` and nothing else — parses clean
 * and would be handed an empty `units` array it never declared, which every later reader takes as
 * "this session was assigned nothing". That is the case a `payload.units[]`-only reading drops on the
 * floor, and it is why the scope rides on `assignedUnitIds` rather than on the payload.
 *
 * AN INSTANCE ID IS NEVER CARRIED. A fresh siegelense instance is started per work item, so a copied
 * `instanceId` / `runId` names a lane that has already been torn down — stale by construction rather
 * than merely out of date.
 *
 * `baselineFor` IS CARRIED, AND IT COMES OFF THE PIECE RATHER THAN THE PAYLOAD. A re-minted attack
 * measures against the same happy run the first one did, so the pointer has to survive the copy or
 * the antagonist's absence claim has nothing behind it.
 */

import type { UnitId } from '@dungeonmaster/shared/contracts';

import { mintedWorkItemContract } from '../../contracts/minted-work-item/minted-work-item-contract';
import type { MintedWorkItem } from '../../contracts/minted-work-item/minted-work-item-contract';
import { workItemAssignmentContract } from '../../contracts/work-item-assignment/work-item-assignment-contract';
import type { WorkPlanPiece } from '../../contracts/work-plan-piece/work-plan-piece-contract';

export const pieceBriefPayloadTransformer = ({
  piece,
  unitIds,
}: {
  piece: WorkPlanPiece;
  unitIds: readonly UnitId[];
}): MintedWorkItem['payload'] => {
  const parsed = mintedWorkItemContract.shape.payload.safeParse(piece.payload);
  const source = parsed.success ? parsed.data : undefined;

  const carried =
    source === undefined
      ? {}
      : Object.fromEntries(
          Object.entries(source).filter(
            (entry) => entry[0] !== 'instanceId' && entry[0] !== 'runId',
          ),
        );

  const retained = new Set(unitIds.map(String));
  const assignment = workItemAssignmentContract.safeParse(carried);

  return {
    ...carried,
    pieceName: piece.pieceName,
    ...('units' in carried && assignment.success
      ? { units: assignment.data.units.filter((unit) => retained.has(String(unit.unitId))) }
      : {}),
    ...(piece.baselineFor === undefined ? {} : { baselineFor: piece.baselineFor }),
  };
};
