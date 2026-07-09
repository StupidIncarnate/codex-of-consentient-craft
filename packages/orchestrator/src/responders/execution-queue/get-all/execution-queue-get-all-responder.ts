/**
 * PURPOSE: Returns the cross-guild quest execution queue, DERIVED FRESH FROM DISK on every read —
 * the FIFO-ordered (oldest `createdAt` first) list of actively-executing quests, one QuestQueueEntry
 * each. There is no in-memory or JSON-file queue snapshot: the same `questActiveQuestsBroker`
 * discovery whose head `questGetNextStepBroker` dispatches is re-scanned here, so a quest that just
 * started (or a higher-priority one that just arrived) always shows up on the next read, and a
 * server restart never blanks the list. The head of this array is exactly what the dispatcher runs
 * next; `activeSessionId` is derived from each quest's live workItems for the queue-bar links.
 *
 * USAGE:
 * const entries = await ExecutionQueueGetAllResponder();
 * // Returns readonly QuestQueueEntry[] — head at index 0, empty when nothing is executing.
 */

import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';

import { questActiveQuestsBroker } from '../../../brokers/quest/active-quests/quest-active-quests-broker';
import { questActiveSessionTransformer } from '../../../transformers/quest-active-session/quest-active-session-transformer';

export const ExecutionQueueGetAllResponder = async (): Promise<readonly QuestQueueEntry[]> =>
  (await questActiveQuestsBroker()).map(({ quest, guildId, guildSlug }): QuestQueueEntry => {
    const { sessionId } = questActiveSessionTransformer({ workItems: quest.workItems });

    return questQueueEntryContract.parse({
      questId: quest.id,
      guildId,
      guildSlug,
      questTitle: quest.title,
      status: quest.status,
      enqueuedAt: quest.createdAt,
      ...(quest.questSource === undefined ? {} : { questSource: quest.questSource }),
      ...(sessionId === undefined ? {} : { activeSessionId: sessionId }),
    });
  });
