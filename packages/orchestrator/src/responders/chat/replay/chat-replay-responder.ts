/**
 * PURPOSE: Replays a chat session's history and links any associated quest
 *
 * USAGE:
 * await ChatReplayResponder({ sessionId, guildId, chatProcessId });
 * // Replays JSONL history via callbacks and emits quest-session-linked if a quest is found
 */

import type { GuildId, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';
import { processIdContract } from '@dungeonmaster/shared/contracts';

import { chatHistoryReplayBroker } from '../../../brokers/chat/history-replay/chat-history-replay-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

export const ChatReplayResponder = async ({
  sessionId,
  guildId,
  chatProcessId: clientChatProcessId,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  chatProcessId?: ProcessId;
}): Promise<void> => {
  const chatProcessId =
    clientChatProcessId ?? processIdContract.parse(`replay-${crypto.randomUUID()}`);

  await chatHistoryReplayBroker({
    sessionId,
    guildId,
    onEntry: ({ entry }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, line: JSON.stringify(entry) },
      });
    },
    onPatch: ({ toolUseId, agentId }) => {
      orchestrationEventsState.emit({
        type: 'chat-patch',
        processId: chatProcessId,
        payload: { chatProcessId, toolUseId, agentId },
      });
    },
  });

  try {
    const quests = await questListBroker({ guildId });
    const linkedQuest = quests.find((quest) => quest.questCreatedSessionBy === sessionId);

    if (linkedQuest) {
      orchestrationEventsState.emit({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId: linkedQuest.id, chatProcessId },
      });
    }
  } catch {
    // Quest lookup failure should not block history replay
  }

  orchestrationEventsState.emit({
    type: 'chat-history-complete',
    processId: chatProcessId,
    payload: { chatProcessId, sessionId },
  });
};
