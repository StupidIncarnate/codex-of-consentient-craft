/**
 * PURPOSE: Layer broker for questQueueSyncListenerBroker — resolves the current quest for a just-modified questId and keeps the execution queue in sync (removes on delete/terminal, updates status + activeSessionId otherwise).
 *
 * USAGE:
 * await processSyncEventLayerBroker({ questId, loadQuest, removeByQuestId, updateEntryStatus, updateEntryActiveSession });
 * // On terminal status (complete/blocked/abandoned) OR when every workItem is terminal:
 * //   updates the entry's status then removes it from the queue.
 * // On quest-not-found (deleted): removes any matching entry.
 * // On non-terminal, still-pending-work case: pushes the derived activeSessionId so the
 * //   web's queue bar links remain accurate as work items spawn agents and acquire sessions.
 *
 * WHEN-TO-USE: Only from createSyncHandlerLayerBroker's event handler.
 * WHEN-NOT-TO-USE: Anywhere outside the execution-queue sync listener.
 *
 * WHY workItems-terminal is a tie-breaker: the orchestration loop leaves quest.status at
 * `in_progress` in some failure-routing paths even when every workItem has drained to a
 * terminal state (complete/failed/skipped). From the queue's perspective, that quest is
 * done — there's no more work the runner can dispatch — so the entry must be removed to
 * unblock the head. The shared `isTerminalQuestStatusGuard` treats `blocked` as non-terminal
 * (resumable), but from the runner's perspective a blocked quest is a stable endpoint —
 * the same "runner done with this quest" semantics as the smoketest-poll guard.
 *
 * WHY activeSessionId pushes only on the non-terminal branch: terminal entries are about
 * to be removed from the queue, so updating their session field would just bounce a
 * change handler on a row that's about to disappear. Live entries running through their
 * phases are the ones that need the sessionId pushed so the UI's queue bar can hyperlink
 * to the active agent's chat.
 */

import type {
  AdapterResult,
  Quest,
  QuestId,
  QuestStatus,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { isSmoketestPollTerminalStatusGuard } from '../../../guards/is-smoketest-poll-terminal-status/is-smoketest-poll-terminal-status-guard';
import { questActiveSessionTransformer } from '../../../transformers/quest-active-session/quest-active-session-transformer';

export const processSyncEventLayerBroker = async ({
  questId,
  loadQuest,
  removeByQuestId,
  updateEntryStatus,
  updateEntryActiveSession,
}: {
  questId: QuestId;
  loadQuest: ({ questId }: { questId: QuestId }) => Promise<Quest | undefined>;
  removeByQuestId: ({ questId }: { questId: QuestId }) => void;
  updateEntryStatus: ({ questId, status }: { questId: QuestId; status: QuestStatus }) => void;
  updateEntryActiveSession: ({
    questId,
    activeSessionId,
  }: {
    questId: QuestId;
    activeSessionId: SessionId | undefined;
  }) => void;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });
  const quest = await loadQuest({ questId });

  if (quest === undefined) {
    // Quest file not found (deleted). Remove any stale queue entry for this quest.
    removeByQuestId({ questId });
    return ok;
  }

  const isTerminalForQueue = isSmoketestPollTerminalStatusGuard({
    status: quest.status,
    workItems: quest.workItems,
  });

  if (!isTerminalForQueue) {
    // Still has pending/running work — push the derived activeSessionId so the queue bar
    // can route clicks to the live agent's chat as work items spawn and progress.
    const { sessionId } = questActiveSessionTransformer({ workItems: quest.workItems });
    updateEntryActiveSession({ questId, activeSessionId: sessionId });
    return ok;
  }

  // Terminal for queue purposes: update the entry's status first (so observers see the
  // transition), then remove it so the runner can advance to the next head.
  updateEntryStatus({ questId, status: quest.status });
  removeByQuestId({ questId });
  return ok;
};
