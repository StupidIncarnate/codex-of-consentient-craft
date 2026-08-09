/**
 * PURPOSE: Starts or resumes the single post-quest tavernkeeper conversation, persisting its
 * work item BEFORE spawning so chatSpawnBroker's own quest lookup always finds it and a
 * crash/merge-stopped session is resumed by sessionId rather than duplicated.
 *
 * USAGE:
 * const { chatProcessId } = await FollowupChatStartResponder({ guildId, questId, message });
 * // Creates (first message) or resumes (later messages) the quest's tavernkeeper work item and
 * // spawns/resumes the chat, streaming output via orchestration events
 */

import {
  getQuestInputContract,
  questWorkItemIdContract,
  workItemContract,
  workItemRoleContract,
} from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  ModifyQuestInput,
  ProcessId,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

export const FollowupChatStartResponder = async ({
  guildId,
  questId,
  message,
}: {
  guildId: GuildId;
  questId: QuestId;
  message: string;
}): Promise<{ chatProcessId: ProcessId }> => {
  const questResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });

  if (!questResult.success || !questResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  // Match on role alone, never status. A tavernkeeper item is inert by design — nothing drives
  // it to a terminal status the way a relay item is driven — so a session killed by a server
  // crash, or stopped for a merge, leaves it sitting `in_progress` (or `failed`) forever. The
  // next follow-up message must still resume THAT item's sessionId rather than mint a second
  // item, whatever state the item was left in.
  const existingItem = questResult.quest.workItems.find((wi) => wi.role === 'tavernkeeper');

  const tavernkeeperWorkItemId: QuestWorkItemId =
    existingItem?.id ?? questWorkItemIdContract.parse(crypto.randomUUID());
  const resumeSessionId = existingItem?.sessionId;

  const nowIso = new Date().toISOString();

  // Persisted BEFORE the spawn so chatSpawnBroker's own quest lookup (resolveChatQuestLayerBroker's
  // tavernkeeper branch) always finds this item — on the first message it would otherwise see no
  // tavernkeeper work item at all. The payload carries ONLY workItems: no status (tavernkeeper is
  // excluded from status derivation) and no operations (the follow-up chat is deliberately not a
  // ledger entry).
  const modifyResult = await questModifyBroker({
    input: {
      questId,
      workItems:
        existingItem === undefined
          ? [
              workItemContract.parse({
                id: tavernkeeperWorkItemId,
                role: 'tavernkeeper',
                status: 'in_progress',
                spawnerType: 'agent',
                dependsOn: [],
                relatedDataItems: [],
                createdAt: nowIso,
                startedAt: nowIso,
              }),
            ]
          : [{ id: tavernkeeperWorkItemId, status: 'in_progress', startedAt: nowIso }],
    } as ModifyQuestInput,
  });

  if (!modifyResult.success) {
    throw new Error(
      `Failed to persist tavernkeeper work item for quest ${questId}: ${modifyResult.error}`,
    );
  }

  // Kill any process still registered for this work item before spawning the new turn, so its
  // lingering post-exit JSONL tail stops watching before the new turn writes to the same file.
  const runningProcess = orchestrationProcessesState.findByQuestWorkItemId({
    questWorkItemId: tavernkeeperWorkItemId,
  });
  if (runningProcess) {
    orchestrationProcessesState.kill({ processId: runningProcess.processId });
  }

  const spawnResult = await chatSpawnBroker({
    role: workItemRoleContract.parse('tavernkeeper'),
    guildId,
    questId,
    message,
    ...(resumeSessionId === undefined ? {} : { sessionId: resumeSessionId }),
    onEntries: ({ chatProcessId, entries }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, entries, questId, workItemId: tavernkeeperWorkItemId },
      });
    },
    onSessionIdExtracted: ({ chatProcessId, sessionId }) => {
      orchestrationEventsState.emit({
        type: 'chat-session-started',
        processId: chatProcessId,
        payload: { chatProcessId, sessionId, questId, workItemId: tavernkeeperWorkItemId },
      });
    },
    onComplete: ({ chatProcessId, exitCode, sessionId }) => {
      questModifyBroker({
        input: {
          questId,
          workItems: [
            {
              id: tavernkeeperWorkItemId,
              status: 'complete',
              completedAt: new Date().toISOString(),
            },
          ],
        } as ModifyQuestInput,
      }).catch((error: unknown) => {
        process.stderr.write(`[followup-chat] work-item update failed: ${String(error)}\n`);
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
          workItemId: tavernkeeperWorkItemId,
        },
      });
    },
    registerProcess: ({ processId, questWorkItemId, kill }) => {
      orchestrationProcessesState.register({
        orchestrationProcess: { processId, questId, questWorkItemId, kill },
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

  return { chatProcessId: spawnResult.chatProcessId };
};
