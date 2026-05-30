/**
 * PURPOSE: Generalized recovery splice — insert caller-built fixer items + a retry for the failed item, rewiring downstream onto the retry. Both ward and lawbringer recovery reuse it.
 *
 * USAGE:
 * await questSpliceFixerBroker({ questId, quest, failedWorkItemId, fixerItems, retryItem });
 * // Appends fixerItems (each depends on the failed item) + retryItem (depends on all fixers),
 * // rewires downstream deps from failedWorkItemId onto retryItem.id, quest stays in_progress.
 * // No-ops if an item already carries insertedBy === failedWorkItemId (double signal-back guard).
 */

import type {
  AdapterResult,
  Quest,
  QuestId,
  QuestWorkItemId,
  WorkItem,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { questWorkItemInsertBroker } from '../work-item-insert/quest-work-item-insert-broker';

export const questSpliceFixerBroker = async ({
  questId,
  quest,
  failedWorkItemId,
  fixerItems,
  retryItem,
}: {
  questId: QuestId;
  quest: Quest;
  failedWorkItemId: QuestWorkItemId;
  fixerItems: WorkItem[];
  retryItem: WorkItem;
}): Promise<AdapterResult> => {
  const alreadyHandled = quest.workItems.some((wi) => wi.insertedBy === failedWorkItemId);

  if (alreadyHandled) {
    return adapterResultContract.parse({ success: true });
  }

  return questWorkItemInsertBroker({
    questId,
    quest,
    newWorkItems: [...fixerItems, retryItem],
    replacementMapping: [{ oldId: failedWorkItemId, newId: retryItem.id }],
  });
};
