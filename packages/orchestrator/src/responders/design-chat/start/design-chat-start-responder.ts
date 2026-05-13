/**
 * PURPOSE: Starts a design chat session by spawning a Glyphsmith Claude CLI process and setting up event streaming
 *
 * USAGE:
 * const { chatProcessId } = await DesignChatStartResponder({ guildId, questId, message });
 * // Spawns design chat process, streams output via orchestration events
 */

import { questWorkItemIdContract, workItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const DesignChatStartResponder = async ({
  guildId,
  questId,
  message,
}: {
  guildId: GuildId;
  questId: QuestId;
  message: string;
}): Promise<{ chatProcessId: ProcessId }> => {
  // Create glyphsmith work item ID upfront for tracking. Stamped on every emit so the
  // server can route per-quest broadcasts to the right subscribed clients.
  const glyphWorkItemId: QuestWorkItemId = questWorkItemIdContract.parse(crypto.randomUUID());

  const result = await chatSpawnBroker({
    role: workItemRoleContract.parse('glyphsmith'),
    guildId,
    questId,
    message,
    onDesignSessionLinked: ({ questId: qId, chatProcessId }) => {
      orchestrationEventsState.emit({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId: qId, chatProcessId, workItemId: glyphWorkItemId },
      });
    },
    onEntries: ({ chatProcessId, entries }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, entries, questId, workItemId: glyphWorkItemId },
      });
    },
    onSessionIdExtracted: ({ chatProcessId, sessionId: sid }) => {
      orchestrationEventsState.emit({
        type: 'chat-session-started',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          sessionId: sid,
          questId,
          workItemId: glyphWorkItemId,
        },
      });
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
        payload: {
          chatProcessId,
          exitCode,
          sessionId,
          questId,
          workItemId: glyphWorkItemId,
        },
      });
    },
    registerProcess: ({ processId, kill }) => {
      orchestrationProcessesState.register({
        orchestrationProcess: { processId, questId, kill },
      });
    },
    recordActivity: ({ processId }) => {
      orchestrationProcessesState.recordActivity({ processId });
    },
    setMetadata: ({ processId, osPid }) => {
      orchestrationProcessesState.setMetadata({
        processId,
        ...(osPid === undefined ? {} : { osPid }),
      });
    },
  });

  return { chatProcessId: result.chatProcessId };
};
