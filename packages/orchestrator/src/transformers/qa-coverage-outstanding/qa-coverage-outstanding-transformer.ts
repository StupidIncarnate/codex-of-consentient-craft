/**
 * PURPOSE: Returns the QA checklist units still carrying no disposition for a siegemaster operation
 * item — the list the signal-back completion gate refuses `done` on
 *
 * USAGE:
 * qaCoverageOutstandingTransformer({ quest, operationItem });
 * // Returns QaChecklistItemId[] — empty means every unit on this item's flows has been dealt with
 *
 * This exists so completion is COMPUTED. A session holds its own coverage in working context, and a
 * long serial run degrades that context well before the flow is finished — which is how a pass
 * covers part of a flow and reports done. Recomputing from the graph and the persisted ledger takes
 * the claim out of the agent's hands entirely.
 *
 * Scope comes from the item's own `flowIds`. An item declaring none is NOT gated: a flow-less quest
 * seeds exactly that, and so do items authored before this gate existed — silently wedging those
 * would be a worse failure than the one being prevented. The gate only ever binds an item that
 * declares what it covers.
 *
 * Every disposition clears a unit, including `gap` and `recorded`. What the gate refuses is the
 * absence of any entry at all, so it can always be satisfied honestly.
 */

import type { OperationItem, QaChecklistItemId, Quest } from '@dungeonmaster/shared/contracts';

import { qaChecklistBuildTransformer } from '../qa-checklist-build/qa-checklist-build-transformer';

export const qaCoverageOutstandingTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): QaChecklistItemId[] => {
  if (operationItem.role !== 'siegemaster') {
    return [];
  }

  const scopedFlowIds = new Set(operationItem.flowIds.map(String));
  if (scopedFlowIds.size === 0) {
    return [];
  }

  return quest.flows
    .filter((flow) => scopedFlowIds.has(String(flow.id)))
    .flatMap(
      (flow) =>
        qaChecklistBuildTransformer({ flow, ledger: quest.planningNotes.qaLedger })
          .remainingItemIds,
    );
};
