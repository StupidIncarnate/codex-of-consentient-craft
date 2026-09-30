/**
 * PURPOSE: Resolves an operation item's flowIds into the flow names the operations ledger displays
 *
 * USAGE:
 * operationFlowLabelsTransformer({ flowIds: operation.flowIds, flows: quest.flows });
 * // Returns ['Send queued comment batch'] — the flow's name, or the raw id when it no longer resolves
 *
 * An id with no matching flow falls back to the id itself rather than being dropped: the flow was
 * renamed or deleted after the item was written, and that drift is exactly what the row should show.
 */

import type { Flow, FlowId } from '@dungeonmaster/shared/contracts';


export const operationFlowLabelsTransformer = ({
  flowIds,
  flows,
}: {
  flowIds: readonly FlowId[];
  flows: readonly Flow[];
}): string[] => {
  const namesById = new Map(flows.map((flow) => [String(flow.id), String(flow.name)]));

  return flowIds.map((flowId) =>
    (namesById.get(String(flowId)) ?? String(flowId)),
  );
};
