/**
 * PURPOSE: Starts a chat session by handling pending clarifications, spawning a Claude CLI process, and setting up event streaming
 *
 * USAGE:
 * const { chatProcessId } = await ChatStartResponder({ guildId, message, sessionId });
 * // Spawns chat process, streams output via orchestration events, handles clarifications
 */

import type { GuildId, ProcessId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { chatSubagentTailBroker } from '../../../brokers/chat/subagent-tail/chat-subagent-tail-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { modifyQuestInputContract } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import { streamJsonLineContract } from '../../../contracts/stream-json-line/stream-json-line-contract';
import { chatProcessState } from '../../../state/chat-process/chat-process-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
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
      try {
        const clarificationInput = modifyQuestInputContract.parse({
          questId: pending.questId,
          clarifications: [
            {
              id: crypto.randomUUID(),
              questions: pending.questions,
              answer: message,
              timestamp: new Date().toISOString(),
            },
          ],
        });
        process.stderr.write(
          `[CLARIFICATION-DEBUG] modifyQuestInput parsed OK, saving clarification\n`,
        );
        questModifyBroker({
          input: clarificationInput,
        })
          .then(() => {
            process.stderr.write(
              `[CLARIFICATION-DEBUG] clarification saved to quest successfully\n`,
            );
          })
          .catch((error: unknown) => {
            process.stderr.write(
              `[CLARIFICATION-DEBUG] FAILED to save clarification: ${error instanceof Error ? error.message : String(error)}\n`,
            );
          });
      } catch (parseError: unknown) {
        process.stderr.write(
          `[CLARIFICATION-DEBUG] PARSE ERROR: ${parseError instanceof Error ? parseError.message : String(parseError)}\n`,
        );
      }
    }
  }

  let chatQuestId: QuestId | null = null;

  if (sessionId) {
    try {
      const quests = await questListBroker({ guildId });
      const linkedQuest = quests.find((quest) => quest.questCreatedSessionBy === sessionId);
      if (linkedQuest) {
        chatQuestId = linkedQuest.id;
        process.stderr.write(
          `[CLARIFICATION-DEBUG] resumed session: found linked questId=${chatQuestId}\n`,
        );
      }
    } catch {
      // Quest lookup failure should not block chat startup
    }
  }

  const processor = chatLineProcessTransformer();
  const subagentStopHandles: (() => void)[] = [];

  return chatSpawnBroker({
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

      chatProcessState.remove({ processId: chatProcessId });
      orchestrationEventsState.emit({
        type: 'chat-complete',
        processId: chatProcessId,
        payload: { chatProcessId, exitCode, sessionId: sid },
      });
    },
    registerProcess: ({ processId, kill }) => {
      chatProcessState.register({ processId, kill });
    },
  });
};
