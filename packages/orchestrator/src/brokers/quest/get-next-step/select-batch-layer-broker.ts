/**
 * PURPOSE: Layer helper for questGetNextStepBroker — picks the work-items to bundle into a single spawn-agents response. Returns all pathseeker-surface items together, all spiritmender items together (parallel recovery dispatch), all blightwarden minions together (parallel report-only audit), both pathseeker-corrections items together when both ready, otherwise the single first ready item. The `ready` list arrives in floor order (computeReadyWorkItemsLayerBroker sorts via workItemsInDispatchOrderTransformer), so "the first ready item" is the shallowest-floor one — a deeper-floor item is never dispatched while a shallower-floor item is still pending. Ward items are handled by the parent broker before this runs.
 *
 * USAGE:
 * const batch = selectBatchLayerBroker({ ready });
 * // Returns: WorkItem[] — 0..N items to dispatch in one spawn-agents response.
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

import { isBlightwardenMinionRoleGuard } from '../../../guards/is-blightwarden-minion-role/is-blightwarden-minion-role-guard';

export const selectBatchLayerBroker = ({ ready }: { ready: WorkItem[] }): WorkItem[] => {
  // Pathseeker-surface — every ready surface item batches together.
  const surfaceItems = ready.filter((item) => item.role === 'pathseeker-surface');
  if (surfaceItems.length > 0) {
    return surfaceItems;
  }

  // Spiritmender — every ready spiritmender batches together (parallel recovery dispatch).
  const spiritmenderItems = ready.filter((item) => item.role === 'spiritmender');
  if (spiritmenderItems.length > 0) {
    return spiritmenderItems;
  }

  // Blightwarden minions — every ready minion batches together (parallel report-only audit). The
  // synthesizer (`blightwarden`) is NOT a minion, so it falls through to single-item dispatch.
  const minionItems = ready.filter((item) => isBlightwardenMinionRoleGuard({ role: item.role }));
  if (minionItems.length > 0) {
    return minionItems;
  }

  // Pathseeker-corrections — dedup + assertion-correctness when both are ready simultaneously.
  const dedupItems = ready.filter((item) => item.role === 'pathseeker-dedup');
  const assertionItems = ready.filter((item) => item.role === 'pathseeker-assertion-correctness');
  if (dedupItems.length > 0 && assertionItems.length > 0) {
    return [...dedupItems, ...assertionItems];
  }

  // Everything else — one agent at a time.
  const [first] = ready;
  return first ? [first] : [];
};
