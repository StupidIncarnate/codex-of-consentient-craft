/**
 * PURPOSE: Cuts question 2's `unmet` units into the successor work items the router mints at the
 * step's `routes.unmet` target — one per originating plan piece, plus one per HOLDER for the units
 * no piece claims. Lives beside `nextActionTransformer` as its layer because only that router mints
 * a mark-minted batch.
 *
 * USAGE:
 * unmetBatchLayerTransformer({ plan, unmetUnitIds, terminalStepItems, step: 'repair',
 *   unmetTarget: 'repair', itemRole: 'codeweaver', needsLane: false });
 * // Returns: MintedWorkItem[]
 *
 * UNCLAIMED UNITS GROUP BY HOLDER, NEVER ONE ITEM PER UNIT. The holder's own session carried them
 * together and its successor reads them together; one session per unit multiplies the dispatches
 * for no gain in what any one of them can settle.
 *
 * A SELF-LOOP PASSES ITS MINTER THROUGH. Where `unmet` routes a step back to itself (`repair`,
 * `fixHappy`, `fixAdversarial`), the successor's `mintedBy` names the holder's own minter rather than
 * the holder. Naming the holder puts the successor's return edge on another visit of the same step,
 * so a finished fix would return to a fresh fixer instead of the gate or walker that started the
 * loop, and that gate would never run again to judge it.
 */

import type { QaChecklistItem, WorkItem, WorkPlanPiece } from '@dungeonmaster/shared/contracts';

import { mintedWorkItemContract } from '../../contracts/minted-work-item/minted-work-item-contract';
import type { MintedWorkItem } from '../../contracts/minted-work-item/minted-work-item-contract';
import type { WorkPlan } from '../../contracts/work-plan/work-plan-contract';
import { pieceBriefPayloadTransformer } from '../piece-brief-payload/piece-brief-payload-transformer';

export const unmetBatchLayerTransformer = ({
  plan,
  unmetUnitIds,
  terminalStepItems,
  step,
  unmetTarget,
  itemRole,
  needsLane,
}: {
  plan: WorkPlan | null;
  unmetUnitIds: readonly QaChecklistItem['id'][];
  terminalStepItems: readonly WorkItem[];
  step: string;
  unmetTarget: string;
  itemRole: MintedWorkItem['role'];
  needsLane: boolean;
}): MintedWorkItem[] => {
  const claimedBy = new Map<QaChecklistItem['id'], WorkPlanPiece>();

  for (const planBatch of plan?.batches ?? []) {
    for (const piece of planBatch.pieces) {
      for (const claimed of piece.assignedUnitIds) {
        if (!claimedBy.has(claimed)) {
          claimedBy.set(claimed, piece);
        }
      }
    }
  }

  const fallbackHolder = terminalStepItems.at(-1);
  const newestFirst = [...terminalStepItems].reverse();
  const selfLoop = unmetTarget === step;

  const claimedGroups = (plan?.batches ?? [])
    .flatMap((planBatch) => planBatch.pieces)
    .map((piece) => ({
      piece,
      unitIds: unmetUnitIds.filter((unitId) => claimedBy.get(unitId) === piece),
    }))
    .filter((group) => group.unitIds.length > 0);

  const unclaimedByHolder = new Map<WorkItem | undefined, QaChecklistItem['id'][]>();

  for (const unitId of unmetUnitIds.filter((candidate) => !claimedBy.has(candidate))) {
    const holder =
      newestFirst.find((item) =>
        item.assignedUnitIds.some((held) => String(held) === String(unitId)),
      ) ?? fallbackHolder;

    unclaimedByHolder.set(holder, [...(unclaimedByHolder.get(holder) ?? []), unitId]);
  }

  const groups = [
    ...claimedGroups.map((group) => ({
      unitIds: group.unitIds,
      payload: pieceBriefPayloadTransformer({ piece: group.piece, unitIds: group.unitIds }),
      holder:
        newestFirst.find((item) =>
          item.assignedUnitIds.some((held) =>
            group.unitIds.some((unitId) => String(unitId) === String(held)),
          ),
        ) ?? fallbackHolder,
    })),
    ...[...unclaimedByHolder.entries()].map(([holder, unitIds]) => ({
      unitIds,
      payload: undefined,
      holder,
    })),
  ];

  return groups.map(({ unitIds, payload, holder }) => {
    const mintedBy =
      holder === undefined ? undefined : selfLoop ? (holder.mintedBy ?? holder.id) : holder.id;

    return mintedWorkItemContract.parse({
      step: unmetTarget,
      role: itemRole,
      assignedUnitIds: unitIds,
      needsLane,
      ...(payload === undefined ? {} : { payload }),
      ...(mintedBy === undefined ? {} : { mintedBy }),
    });
  });
};
