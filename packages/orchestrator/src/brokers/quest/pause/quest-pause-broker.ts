/**
 * PURPOSE: Shared pause logic — kills every registered orchestration subprocess for a quest, resets its in-flight work items to pending, and flips quest status to paused with the pre-pause status captured in pausedAtStatus. A quest carries more than one registration at once (Start's quest-level entry alongside each spawned agent's), so stopping at the first one leaves a live agent behind on a quest the user has paused.
 *
 * USAGE:
 * const result = await questPauseBroker({
 *   questId,
 *   guildId,
 *   previousStatus: 'in_progress',
 *   processControls: { findAllByQuestId, kill },
 * });
 * // Returns { paused: true } on a successful pause, { paused: false } when the quest is missing or the modify call fails.
 *
 * WHY processControls is a parameter: brokers cannot import from state/, so the caller
 * (responder) supplies the real `orchestrationProcessesState` methods; tests inject jest mocks.
 */

import type {
  GuildId,
  ModifyQuestInput,
  ProcessId,
  QuestId,
  QuestStatus,
} from '@dungeonmaster/shared/contracts';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import { isActiveWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questPauseBroker = async ({
  questId,
  previousStatus,
  processControls,
}: {
  questId: QuestId;
  guildId?: GuildId;
  previousStatus: QuestStatus;
  processControls: {
    findAllByQuestId: ({ questId }: { questId: QuestId }) => { processId: ProcessId }[];
    kill: ({ processId }: { processId: ProcessId }) => void;
  };
}): Promise<{ paused: boolean }> => {
  // EVERY registration for the quest, not the first one. Start Quest registers a quest-level
  // entry whose kill is a no-op, and it is registered before anything is spawned — so a lookup
  // that stops at the first match kills that no-op and leaves the real agent child running
  // against the worktree while the quest reads `paused`.
  for (const existingProcess of processControls.findAllByQuestId({ questId })) {
    processControls.kill({ processId: existingProcess.processId });
  }

  const getResult = await questGetBroker({
    input: getQuestInputContract.parse({ questId }),
  });
  if (!getResult.success || getResult.quest === undefined) {
    return { paused: false };
  }

  const { quest } = getResult;
  const orphanedItems = quest.workItems
    .filter((workItem) => isActiveWorkItemStatusGuard({ status: workItem.status }))
    .map((workItem) => ({ id: workItem.id, status: 'pending' as const }));

  const modifyResult = await questModifyBroker({
    input: {
      questId,
      status: 'paused',
      pausedAtStatus: previousStatus,
      ...(orphanedItems.length > 0 ? { workItems: orphanedItems } : {}),
    } as ModifyQuestInput,
  });

  if (!modifyResult.success) {
    return { paused: false };
  }

  return { paused: true };
};
