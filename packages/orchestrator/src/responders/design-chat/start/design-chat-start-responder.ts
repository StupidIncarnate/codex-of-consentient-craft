/**
 * PURPOSE: Starts a design chat session by spawning a Glyphsmith Claude CLI process and setting up event streaming
 *
 * USAGE:
 * const { chatProcessId } = await DesignChatStartResponder({ guildId, questId, message });
 * // Spawns design chat process, streams output via orchestration events
 */

import type { GuildId, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { chatRoleContract } from '../../../contracts/chat-role/chat-role-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

export const DesignChatStartResponder = async ({
  guildId,
  questId,
  message,
}: {
  guildId: GuildId;
  questId: QuestId;
  message: string;
}): Promise<{ chatProcessId: ProcessId }> => {
  const processor = chatLineProcessTransformer();

  return chatSpawnBroker({
    role: chatRoleContract.parse('glyphsmith'),
    guildId,
    questId,
    message,
    processor,
    onDesignSessionLinked: ({ questId: qId, chatProcessId }) => {
      orchestrationEventsState.emit({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId: qId, chatProcessId },
      });
    },
    onEntry: ({ chatProcessId, entry }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, line: JSON.stringify(entry) },
      });
    },
    onPatch: ({ chatProcessId, toolUseId, agentId }) => {
      orchestrationEventsState.emit({
        type: 'chat-patch',
        processId: chatProcessId,
        payload: { chatProcessId, toolUseId, agentId },
      });
    },
    onAgentDetected: () => {
      // Design chat does not tail sub-agents
    },
    onComplete: ({ chatProcessId, exitCode, sessionId }) => {
      orchestrationProcessesState.remove({ processId: chatProcessId });
      orchestrationEventsState.emit({
        type: 'chat-complete',
        processId: chatProcessId,
        payload: { chatProcessId, exitCode, sessionId },
      });
    },
    registerProcess: ({ processId, kill }) => {
      orchestrationProcessesState.register({
        orchestrationProcess: { processId, questId, kill },
      });
    },
  });
};
