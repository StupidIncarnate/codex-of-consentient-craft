/**
 * PURPOSE: Starts a chat session by finding/creating quest, creating chaos work item, and kicking orchestration loop
 *
 * USAGE:
 * const { chatProcessId } = await ChatStartResponder({ guildId, message, sessionId });
 * // Creates chaos work item, kicks orchestration loop with userMessage
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { chatSubagentTailBroker } from '../../../brokers/chat/subagent-tail/chat-subagent-tail-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { chatRoleContract } from '../../../contracts/chat-role/chat-role-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { pendingClarificationState } from '../../../state/pending-clarification/pending-clarification-state';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { streamJsonToClarificationTransformer } from '../../../transformers/stream-json-to-clarification/stream-json-to-clarification-transformer';

export const ChatStartResponder = async ({
  guildId,
  message,
  sessionId,
}: {
  guildId: GuildId;
  message: string;
  sessionId?: SessionId;
}): Promise<{ chatProcessId: ProcessId }> => {
  if (sessionId) {
    process.stderr.write(`[CLARIFICATION-DEBUG] startChat called with sessionId=${sessionId}\n`);
    const pending = pendingClarificationState.getForSession({ sessionId });
    process.stderr.write(
      `[CLARIFICATION-DEBUG] pending=${pending ? `questId=${pending.questId}, questions=${pending.questions.length}` : 'NONE'}\n`,
    );
    if (pending) {
      pendingClarificationState.removeForSession({ sessionId });
    }
  }

  let chatQuestId: QuestId | null = null;

  if (sessionId) {
    try {
      const quests = await questListBroker({ guildId });
      const linkedQuest = quests.find((quest) =>
        quest.workItems.some((wi) => wi.sessionId === sessionId),
      );
      if (linkedQuest) {
        chatQuestId = linkedQuest.id;
        process.stderr.write(
          `[CLARIFICATION-DEBUG] resumed session: found linked questId=${chatQuestId}\n`,
        );

        const runningProcess = orchestrationProcessesState.findByQuestId({
          questId: chatQuestId,
        });
        if (runningProcess) {
          orchestrationProcessesState.kill({ processId: runningProcess.processId });
        }
      }
    } catch {
      // Quest lookup failure should not block chat startup
    }
  }

  const processor = chatLineProcessTransformer();
  const subagentStopHandles: (() => void)[] = [];

  return chatSpawnBroker({
    role: chatRoleContract.parse('chaoswhisperer'),
    guildId,
    message,
    processor,
    ...(sessionId && { sessionId }),
    onQuestCreated: ({ questId, chatProcessId }) => {
      chatQuestId = questId;
      orchestrationEventsState.emit({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId, chatProcessId },
      });
    },
    onEntry: ({ chatProcessId, entry }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, line: JSON.stringify(entry) },
      });

      const entryJson = JSON.stringify(entry);
      const lineParseResult = streamJsonLineContract.safeParse(entryJson);
      if (lineParseResult.success) {
        const clarification = streamJsonToClarificationTransformer({
          line: lineParseResult.data,
        });
        if (clarification) {
          process.stderr.write(
            `[CLARIFICATION-DEBUG] onEntry: clarification DETECTED with ${clarification.questions.length} questions, chatQuestId=${chatQuestId ?? 'NULL'}\n`,
          );
          orchestrationEventsState.emit({
            type: 'clarification-request',
            processId: chatProcessId,
            payload: { chatProcessId, questions: clarification.questions },
          });

          if (chatQuestId) {
            pendingClarificationState.setForProcess({
              processId: chatProcessId,
              questId: chatQuestId,
              questions: clarification.questions,
            });
            process.stderr.write(
              `[CLARIFICATION-DEBUG] onEntry: stored in pendingClarificationState for processId=${chatProcessId}\n`,
            );
          } else {
            process.stderr.write(
              `[CLARIFICATION-DEBUG] onEntry: SKIPPED storage - chatQuestId is NULL\n`,
            );
          }
        }
      }
    },
    onPatch: ({ chatProcessId, toolUseId, agentId }) => {
      orchestrationEventsState.emit({
        type: 'chat-patch',
        processId: chatProcessId,
        payload: { chatProcessId, toolUseId, agentId },
      });
    },
    onAgentDetected: ({ chatProcessId, agentId, sessionId: sid }) => {
      chatSubagentTailBroker({
        sessionId: sid,
        guildId,
        agentId,
        processor,
        chatProcessId,
        onEntry: ({ chatProcessId: cpid, entry }) => {
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId: cpid,
            payload: { chatProcessId: cpid, line: JSON.stringify(entry) },
          });
        },
        onPatch: ({ chatProcessId: cpid, toolUseId: tuId, agentId: aId }) => {
          orchestrationEventsState.emit({
            type: 'chat-patch',
            processId: cpid,
            payload: { chatProcessId: cpid, toolUseId: tuId, agentId: aId },
          });
        },
      })
        .then((stop) => {
          subagentStopHandles.push(stop);
        })
        .catch((error: unknown) => {
          process.stderr.write(
            `chatSubagentTailBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
          );
        });
    },
    onComplete: ({ chatProcessId, exitCode, sessionId: sid }) => {
      for (const stop of subagentStopHandles) {
        stop();
      }

      if (sid) {
        const promoted = pendingClarificationState.promoteToSession({
          processId: chatProcessId,
          sessionId: sid,
        });
        process.stderr.write(
          `[CLARIFICATION-DEBUG] onComplete: promoteToSession processId=${chatProcessId} → sessionId=${sid}, promoted=${promoted}\n`,
        );
      } else {
        process.stderr.write(
          `[CLARIFICATION-DEBUG] onComplete: NO sessionId available, skipping promoteToSession\n`,
        );
      }

      orchestrationProcessesState.remove({ processId: chatProcessId });
      orchestrationEventsState.emit({
        type: 'chat-complete',
        processId: chatProcessId,
        payload: { chatProcessId, exitCode, sessionId: sid },
      });
    },
    registerProcess: ({ processId, kill }) => {
      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId: chatQuestId ?? questIdContract.parse(`chat-${processId}`),
          kill,
        },
      });
    },
  });
};
