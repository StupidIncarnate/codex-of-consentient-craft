/**
 * PURPOSE: The in-scope units of one step that NOTHING is going to settle. Reach for this over
 * `stepInScopeUnitsTransformer` whenever the answer drives a decision — what a planner still owes,
 * what a router should mint — and for that sibling when you want the denominator itself, settled
 * units included.
 *
 * USAGE:
 * stepOutstandingUnitsTransformer({ quest, plan, operationItemId, step: 'adversarial' });
 * // Returns UnitId[] — the subset of the step's scope nothing has claimed, held or settled
 *
 * THREE QUALIFIERS, ALL OF WHICH MUST HOLD, and dropping any one of them breaks a different loop:
 *
 * - THE RECORD DOES NOT SETTLE IT — its current mark is `null` or `unmet`. Without this a unit a
 *   completed work item marked `met` reads as outstanding forever and the scope never drains, while
 *   `unmet` staying outstanding is exactly what the loop's forward motion depends on.
 * - NO UNSTARTED PLAN PIECE CLAIMS IT, or a planner's forecast is re-minted as fresh work.
 * - NO LIVE WORK ITEM IS ASSIGNED IT. This one reads like an optimisation and is not: both siege
 *   walkers are `role: 'reviewer'` and both are assigned the full scope, so without it two walkers
 *   running at once each read the other's units as abandoned — the happy walker derives `unmet` on
 *   an off-map family the adversarial walk is halfway through and mints a happy fixer for it.
 *
 * "CLAIMS" MEANS AN UNSTARTED PIECE, and the word carries the whole qualifier. A piece is a forecast
 * and is never removed from the plan, so "any piece names it" would hold a unit out of this set for
 * the rest of the quest — including after that piece's work item came back `unmet`. A piece is
 * STARTED the moment some work item carries its id in `pieceId`.
 *
 * "LIVE" IS `!isTerminalWorkItemStatusGuard`, NEVER A STATUS COMPARISON. There are six work-item
 * statuses: `queued` is live and `skipped` is terminal, so a `pending | in_progress` reading loses
 * exactly a walker sitting between dispatch and start.
 *
 * WHICH WORK ITEMS WERE ASSIGNED A UNIT IS `unitMarkChurnTransformer`'s reading, not a second walk
 * over `payload` here — that union of `payload.units[]` and `observations[]` already covers a
 * session that marked a unit it was not handed, and every work item minted before payloads existed.
 */

import type { OperationItemId, Quest, StepName, UnitId } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { WorkPlan } from '../../contracts/work-plan/work-plan-contract';
import { stepInScopeUnitsTransformer } from '../step-in-scope-units/step-in-scope-units-transformer';
import { unitCurrentMarkTransformer } from '../unit-current-mark/unit-current-mark-transformer';
import { unitMarkChurnTransformer } from '../unit-mark-churn/unit-mark-churn-transformer';

export const stepOutstandingUnitsTransformer = ({
  quest,
  plan,
  operationItemId,
  step,
}: {
  quest: Quest;
  plan: WorkPlan;
  operationItemId: OperationItemId;
  step: StepName;
}): UnitId[] => {
  // Resolved here as well as inside the in-scope call, so the message names the transformer the
  // caller actually invoked. An absent item is a caller bug, and `[]` for it is indistinguishable
  // from a genuinely empty scope — the reading that turns a gate off silently.
  const operationItem = quest.operations.find((item) => item.id === operationItemId);

  if (operationItem === undefined) {
    throw new Error(
      `stepOutstandingUnitsTransformer: quest '${String(quest.id)}' holds no operation item '${String(operationItemId)}'`,
    );
  }

  const startedPieceIds = new Set(
    quest.workItems.flatMap((workItem) =>
      workItem.pieceId === undefined ? [] : [String(workItem.pieceId)],
    ),
  );

  const claimedUnitIds = new Set(
    plan.batches
      .flatMap((batch) => batch.pieces)
      .filter((piece) => !startedPieceIds.has(String(piece.id)))
      .flatMap((piece) => piece.assignedUnitIds.map(String)),
  );

  const workItemsById = new Map(quest.workItems.map((workItem) => [String(workItem.id), workItem]));

  return stepInScopeUnitsTransformer({ quest, operationItemId, step }).filter((unitId) => {
    const currentMark = unitCurrentMarkTransformer({ quest, unitId });

    if (currentMark !== null && currentMark.mark !== 'unmet') {
      return false;
    }

    if (claimedUnitIds.has(String(unitId))) {
      return false;
    }

    return !unitMarkChurnTransformer({ quest, unitId }).some((entry) => {
      const holder = workItemsById.get(String(entry.workItemId));

      return holder !== undefined && !isTerminalWorkItemStatusGuard({ status: holder.status });
    });
  });
};
