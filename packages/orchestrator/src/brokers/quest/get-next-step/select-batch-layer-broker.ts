/**
 * PURPOSE: Layer helper for questGetNextStepBroker — turns the router's selected work item ids into
 * the WorkItem[] batch for one spawn-agents response. `ready` is the eligibility filter
 * (computeReadyWorkItemsLayerBroker's output, already in dispatch order); `selected` is the router's
 * decision, a list of ids in the router's own order. The batch is their intersection, always in
 * READY's dispatch order — an id `selected` names that `ready` no longer carries (already
 * dispatched, reclaimed to `queued`, no longer pending) is dropped rather than re-admitted, and
 * eligibility itself is never re-derived here: `ready` is the only source of it.
 *
 * Every item in one batch is the SAME role at the SAME step — "the only permitted parallelism is
 * multiple agents OF THE SAME ROLE that a SINGLE get-next-step returned together" (this package's
 * CLAUDE.md, "Never parallel-dispatch different roles"). Nothing in the types enforces that, so a
 * batch mixing roles or mixing steps throws here rather than reaching
 * buildSpawnInstructionLayerBroker — role is the invariant this ledger relay can actually violate
 * today (two independently-ready items of different roles with no `dependsOn` between them); step
 * is the same invariant restated for the router this selector also serves.
 *
 * USAGE:
 * const batch = selectBatchLayerBroker({ ready, selected: [workItemId] });
 * // Returns: WorkItem[] — ready ∩ selected, in ready's dispatch order.
 */

import type { QuestWorkItemId, WorkItem } from '@dungeonmaster/shared/contracts';

export const selectBatchLayerBroker = ({
  ready,
  selected,
}: {
  ready: WorkItem[];
  selected: QuestWorkItemId[];
}): WorkItem[] => {
  const selectedIds = new Set(selected);
  const batch = ready.filter((item) => selectedIds.has(item.id));

  const roles = new Set(batch.map((item) => item.role));
  if (roles.size > 1) {
    throw new Error(
      `selectBatchLayerBroker: batch mixes roles across work items ${batch
        .map((item) => `${item.id}:${item.role}`)
        .join(', ')} — the only permitted parallelism is multiple agents of the SAME role`,
    );
  }

  const steps = new Set(batch.map((item) => item.step));
  if (steps.size > 1) {
    throw new Error(
      `selectBatchLayerBroker: batch mixes steps across work items ${batch
        .map((item) => `${item.id}:${String(item.step)}`)
        .join(', ')} — a batch may hold only one step's pieces`,
    );
  }

  return batch;
};
