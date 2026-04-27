/**
 * PURPOSE: Replays a chat session's history and links any associated quest. Emits chat-output / quest-session-linked / chat-history-complete events stamped with questId+workItemId when the session is linked to a quest. Orphan sessions (no linked quest) still emit chat-output frames without those fields — the server filters those out of per-quest broadcasts and routes them only to the requesting readonly viewer client (SessionViewWidget).
 *
 * USAGE:
 * await ChatReplayResponder({ sessionId, guildId, chatProcessId });
 * // Replays JSONL history via callbacks and emits quest-session-linked if a quest is found
 */

import type { AdapterResult, GuildId, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { chatHistoryReplayBroker } from '../../../brokers/chat/history-replay/chat-history-replay-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import type { LinkedQuestInfo } from '../../../contracts/linked-quest-info/linked-quest-info-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

export const ChatReplayResponder = async ({
  sessionId,
  guildId,
  chatProcessId: clientChatProcessId,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  chatProcessId?: ProcessId;
}): Promise<AdapterResult> => {
  const chatProcessId =
    clientChatProcessId ?? processIdContract.parse(`replay-${crypto.randomUUID()}`);

  // Look up the linked quest BEFORE replay so chat-output frames can be stamped with
  // questId+workItemId when available. Orphan sessions (no linked quest) still emit
  // chat-output frames without those fields — the server filters them out of per-quest
  // broadcasts and routes them only to the requesting readonly viewer client.
  const linked = await (async (): Promise<LinkedQuestInfo | null> => {
    try {
      const quests = await questListBroker({ guildId });
      const linkedQuest = quests.find((quest) =>
        quest.workItems.some((wi) => wi.sessionId === sessionId),
      );
      if (linkedQuest === undefined) {
        return null;
      }
      const matchedWorkItem = linkedQuest.workItems.find((wi) => wi.sessionId === sessionId);
      return {
        questId: linkedQuest.id,
        ...(matchedWorkItem ? { workItemId: matchedWorkItem.id, role: matchedWorkItem.role } : {}),
      };
    } catch {
      // Quest lookup failure should not block history replay
      return null;
    }
  })();

  // Build the routing fragment once. Linked sessions stamp questId/workItemId on every
  // payload; orphan sessions leave them off so the server can route to the requesting
  // readonly viewer client only.
  const questIdFragment = linked?.questId === undefined ? {} : { questId: linked.questId };
  const workItemIdFragment =
    linked?.workItemId === undefined ? {} : { workItemId: linked.workItemId };
  const roleFragment = linked?.role === undefined ? {} : { role: linked.role };

  try {
    await chatHistoryReplayBroker({
      sessionId,
      guildId,
      onEntries: ({ entries }) => {
        orchestrationEventsState.emit({
          type: 'chat-output',
          processId: chatProcessId,
          payload: {
            chatProcessId,
            entries,
            ...questIdFragment,
            ...workItemIdFragment,
          },
        });
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Guild not found')) {
      throw error;
    }
    // Session JSONL file may not exist — continue to emit chat-history-complete
  }

  if (linked) {
    orchestrationEventsState.emit({
      type: 'quest-session-linked',
      processId: chatProcessId,
      payload: {
        questId: linked.questId,
        chatProcessId,
        ...workItemIdFragment,
        ...roleFragment,
      },
    });
  }

  orchestrationEventsState.emit({
    type: 'chat-history-complete',
    processId: chatProcessId,
    payload: {
      chatProcessId,
      sessionId,
      ...questIdFragment,
      ...workItemIdFragment,
    },
  });
  return adapterResultContract.parse({ success: true });
};
