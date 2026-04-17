/**
 * PURPOSE: Starts a design chat session by spawning a Glyphsmith Claude CLI process and setting up event streaming
 *
 * USAGE:
 * const { chatProcessId } = await DesignChatStartResponder({ guildId, questId, message });
 * // Spawns design chat process, streams output via orchestration events
 */

import { workItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
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

  // Create glyphsmith work item ID upfront for tracking
  const glyphWorkItemId = crypto.randomUUID();

  return chatSpawnBroker({
    role: workItemRoleContract.parse('glyphsmith'),
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
    onEntries: ({ chatProcessId, entries }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, entries },
      });
    },
    onPatch: ({ chatProcessId, toolUseId, agentId }) => {
      orchestrationEventsState.emit({
        type: 'chat-patch',
        processId: chatProcessId,
        payload: { chatProcessId, toolUseId, agentId },
      });
    },
    onSessionIdExtracted: ({ chatProcessId, sessionId: sid }) => {
      orchestrationEventsState.emit({
        type: 'chat-session-started',
        processId: chatProcessId,
        payload: { chatProcessId, sessionId: sid },
      });
    },
    onAgentDetected: () => {
      // Design chat does not tail sub-agents
    },
    onComplete: ({ chatProcessId, exitCode, sessionId }) => {
      // Create and complete glyphsmith work item in one write
      const glyphWorkItem = workItemContract.parse({
        id: glyphWorkItemId,
        role: 'glyphsmith',
        status: 'complete',
        spawnerType: 'agent',
        dependsOn: [],
        maxAttempts: 1,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        ...(sessionId ? { sessionId } : {}),
      });

      questModifyBroker({
        input: {
          questId,
          workItems: [glyphWorkItem],
        } as ModifyQuestInput,
      }).catch((error: unknown) => {
        process.stderr.write(`[design-chat] work-item update failed: ${String(error)}\n`);
      });

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
