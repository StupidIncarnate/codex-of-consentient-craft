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

  try {
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Guild not found')) {
      throw error;
    }
    // Session JSONL file may not exist — continue to emit chat-history-complete
  }

  try {
    const quests = await questListBroker({ guildId });
    const linkedQuest = quests.find((quest) =>
      quest.workItems.some((wi) => wi.sessionId === sessionId),
    );

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
