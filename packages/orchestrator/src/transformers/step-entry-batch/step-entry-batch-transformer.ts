/**
 * PURPOSE: What a FRESH entry into one step looks like — the work items that step would be handed,
 * and what each of them is assigned. Reach for this over `stepOutstandingUnitsTransformer` when you
 * need the dispatchable ITEMS rather than the unit list: a plan batch at that step becomes one item
 * per piece, where the unit list alone cannot say how the work is cut.
 *
 * USAGE:
 * stepEntryBatchTransformer({
 *   quest, plan, operationItemId, step: 'work',
 *   itemRole: 'codeweaver', stepRole: 'worker', deterministic: false, needsLane: false,
 * });
 * // Returns: MintedWorkItem[] — one per unstarted piece of the first unstarted batch at `work`
 *
 * AN UNSTARTED PIECE BEATS THE ROLE TABLE, whatever role the step declares, because a siege planner
 * cuts pieces at `happyWalk` and `adversarial` — both `reviewer` steps. A role-first reading hands
 * the reviewer its whole in-scope set and silently drops every walk path the planner cut.
 *
 * WITH NO PIECE TO RUN, THE ROLE TABLE DECIDES, and it is read off the step rather than off the
 * family. A `planner` is assigned no units, a `reviewer` gets its scope's WHOLE in-scope set, and a
 * `worker` gets what is still outstanding. A `deterministic` step sits outside the unit gate
 * entirely — it runs code and has nothing to mark — so it takes the planner's shape whatever role it
 * declares.
 *
 * A PIECE'S `assignedUnitIds` IS INTENT AND IS RE-FILTERED HERE. A planner forecasts against the
 * record it could see; by dispatch time a sibling piece may have settled half of it, and handing a
 * session units already `met` is how a step re-marks work nobody asked it to re-do.
 *
 * A WORKER STEP WITH NO UNSTARTED PIECE still mints one item, assigned that step's OUTSTANDING units
 * — the `repair` case, where the fix is real work nobody cut a piece for. It is not an empty answer:
 * an empty batch is `cause: 'capped'` and means something else entirely.
 */

import type { OperationItemId, Quest, StepName } from '@dungeonmaster/shared/contracts';

import { mintedWorkItemContract } from '../../contracts/minted-work-item/minted-work-item-contract';
import type { MintedWorkItem } from '../../contracts/minted-work-item/minted-work-item-contract';
import type { WorkPlan } from '../../contracts/work-plan/work-plan-contract';
import { pieceBriefPayloadTransformer } from '../piece-brief-payload/piece-brief-payload-transformer';
import { stepInScopeUnitsTransformer } from '../step-in-scope-units/step-in-scope-units-transformer';
import { stepOutstandingUnitsTransformer } from '../step-outstanding-units/step-outstanding-units-transformer';
import { unitCurrentMarkTransformer } from '../unit-current-mark/unit-current-mark-transformer';

export const stepEntryBatchTransformer = ({
  quest,
  plan,
  operationItemId,
  step,
  itemRole,
  stepRole,
  deterministic,
  needsLane,
}: {
  quest: Quest;
  plan: WorkPlan | null;
  operationItemId: OperationItemId;
  step: StepName;
  itemRole: MintedWorkItem['role'];
  stepRole: string;
  deterministic: boolean;
  needsLane: boolean;
}): MintedWorkItem[] => {
  // A piece is STARTED the moment some work item carries its id, whatever that item's status —
  // the same reading `stepOutstandingUnitsTransformer` takes, so the two cannot disagree about
  // which pieces are still to come.
  const startedPieceIds = new Set(
    quest.workItems.flatMap((item) => (item.pieceId === undefined ? [] : [String(item.pieceId)])),
  );

  const batch = (plan?.batches ?? []).find((candidate) =>
    candidate.pieces.some(
      (piece) => String(piece.step) === String(step) && !startedPieceIds.has(String(piece.id)),
    ),
  );

  if (batch === undefined) {
    if (deterministic || stepRole === 'planner') {
      return [
        mintedWorkItemContract.parse({ step, role: itemRole, assignedUnitIds: [], needsLane }),
      ];
    }

    return [
      mintedWorkItemContract.parse({
        step,
        role: itemRole,
        assignedUnitIds:
          stepRole === 'reviewer'
            ? stepInScopeUnitsTransformer({ quest, operationItemId, step })
            : plan === null
              ? []
              : stepOutstandingUnitsTransformer({ quest, plan, operationItemId, step }),
        needsLane,
      }),
    ];
  }

  return batch.pieces
    .filter(
      (piece) => String(piece.step) === String(step) && !startedPieceIds.has(String(piece.id)),
    )
    .map((piece) => {
      const assignedUnitIds = piece.assignedUnitIds.filter((unitId) => {
        const mark = unitCurrentMarkTransformer({ quest, unitId });

        return mark === null || mark.mark === 'unmet';
      });
      const payload = pieceBriefPayloadTransformer({ piece, unitIds: assignedUnitIds });

      return mintedWorkItemContract.parse({
        step,
        role: itemRole,
        assignedUnitIds,
        pieceId: piece.id,
        needsLane,
        ...(payload === undefined ? {} : { payload }),
      });
    });
};
