/**
 * PURPOSE: Layer helper for questGetNextStepBroker — picks the work-items to bundle into a single spawn-agents response. Returns all pathseeker-surface items together, all spiritmender items together (parallel recovery dispatch), both pathseeker-corrections items together when both ready, otherwise the single oldest ready item. Ward items are handled by the parent broker before this runs.
 *
 * USAGE:
 * const batch = selectBatchLayerBroker({ ready });
 * // Returns: WorkItem[] — 0..N items to dispatch in one spawn-agents response.
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';

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
