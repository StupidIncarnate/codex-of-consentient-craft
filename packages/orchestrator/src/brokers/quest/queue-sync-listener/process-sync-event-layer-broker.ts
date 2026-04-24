/**
 * PURPOSE: Layer broker for questQueueSyncListenerBroker — resolves the current status of a just-modified quest and keeps the execution queue in sync (removes on delete/terminal, updates status otherwise).
 *
 * USAGE:
 * await processSyncEventLayerBroker({ questId, loadQuestStatus, removeByQuestId, updateEntryStatus });
 * // On terminal status: updates the entry's status and then removes it from the queue.
 * // On quest-not-found (deleted): removes any matching entry.
 * // On non-terminal status: no-op.
 *
 * WHEN-TO-USE: Only from createSyncHandlerLayerBroker's event handler.
 * WHEN-NOT-TO-USE: Anywhere outside the execution-queue sync listener.
 */

import type { AdapterResult, QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { isTerminalQuestStatusGuard } from '@dungeonmaster/shared/guards';

export const processSyncEventLayerBroker = async ({
  questId,
  loadQuestStatus,
  removeByQuestId,
  updateEntryStatus,
}: {
  questId: QuestId;
  loadQuestStatus: ({ questId }: { questId: QuestId }) => Promise<QuestStatus | undefined>;
  removeByQuestId: ({ questId }: { questId: QuestId }) => void;
  updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }) => void;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });
  const status = await loadQuestStatus({ questId });

  if (status === undefined) {
    // Quest file not found (deleted). Remove any stale queue entry for this quest.
    removeByQuestId({ questId });
    return ok;
  }

  if (!isTerminalQuestStatusGuard({ status })) {
    // Non-terminal status change — leave the queue entry intact.
    return ok;
  }

  // Terminal status: update the entry's status first (so observers see the transition),
  // then remove it so the runner can advance to the next head.
  updateEntryStatus({ questId, status });
  removeByQuestId({ questId });
  return ok;
};
