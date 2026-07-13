/**
 * PURPOSE: Layer helper for questGetNextStepBroker — picks the work items to bundle into a single
 * spawn-agents response. The operations relay runs ONE session at a time (each work item is one
 * agent session against one operation item), so this always returns the single first ready item.
 * The `ready` list arrives in dispatch order (computeReadyWorkItemsLayerBroker sorts via
 * workItemsInDispatchOrderTransformer), so "the first ready item" is the next relay step. Ward
 * items are handled by the parent broker before this runs.
 *
 * USAGE:
 * const batch = selectBatchLayerBroker({ ready });
 * // Returns: WorkItem[] — 0..1 items to dispatch in one spawn-agents response.
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

export const selectBatchLayerBroker = ({ ready }: { ready: WorkItem[] }): WorkItem[] => {
  const [first] = ready;
  return first ? [first] : [];
};
