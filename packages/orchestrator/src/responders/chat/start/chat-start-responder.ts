/**
 * PURPOSE: Starts a chat session by finding/creating quest, creating chaos work item, and kicking orchestration loop
 *
 * USAGE:
 * const { chatProcessId } = await ChatStartResponder({ guildId, message, sessionId });
 * // Creates chaos work item, kicks orchestration loop with userMessage
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { chatMainSessionTailBroker } from '../../../brokers/chat/main-session-tail/chat-main-session-tail-broker';
import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { chatSubagentTailBroker } from '../../../brokers/chat/subagent-tail/chat-subagent-tail-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
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
  // Post-exit tail handle for the MAIN session JSONL. Populated on `onComplete` when we
  // have a session ID — catches background-agent task-notifications appended after stdout
  // closes (Claude CLI writes them async). Stopped when the session's process is killed.
  let mainTailStopHandle: (() => void) | null = null;

  return chatSpawnBroker({
    role: workItemRoleContract.parse('chaoswhisperer'),
    guildId,
    message,
    processor,
    ...(sessionId && { sessionId }),
    onQuestCreated: ({ questId, chatProcessId }) => {
      chatQuestId = questId;
      orchestrationEventsState.emit({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId, chatProcessId, role: 'chaoswhisperer' },
      });
    },
    onEntries: ({ chatProcessId, entries }) => {
      orchestrationEventsState.emit({
        type: 'chat-output',
        processId: chatProcessId,
        payload: { chatProcessId, entries },
      });

      for (const entry of entries) {
        if (entry.role !== 'assistant' || entry.type !== 'tool_use') continue;
        const clarification = streamJsonToClarificationTransformer({ entry });
        if (clarification) {
          process.stderr.write(
            `[CLARIFICATION-DEBUG] onEntries: clarification DETECTED with ${clarification.questions.length} questions, chatQuestId=${chatQuestId ?? 'NULL'}\n`,
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
              `[CLARIFICATION-DEBUG] onEntries: stored in pendingClarificationState for processId=${chatProcessId}\n`,
            );
          } else {
            process.stderr.write(
              `[CLARIFICATION-DEBUG] onEntries: SKIPPED storage - chatQuestId is NULL\n`,
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
    onSessionIdExtracted: ({ chatProcessId, sessionId: sid }) => {
      orchestrationEventsState.emit({
        type: 'chat-session-started',
        processId: chatProcessId,
        payload: { chatProcessId, sessionId: sid },
      });
    },
    onAgentDetected: ({ chatProcessId, agentId, sessionId: sid }) => {
      chatSubagentTailBroker({
        sessionId: sid,
        guildId,
        agentId,
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpid, entries }) => {
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId: cpid,
            payload: { chatProcessId: cpid, entries },
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

        // Start tailing the main session JSONL. Claude CLI appends background-agent
        // task-notifications after stdout closes, and those lines only reach the web via
        // this tail. Uses the SAME processor instance as stdout so agentId correlation
        // state carries forward seamlessly.
        chatMainSessionTailBroker({
          sessionId: sid,
          guildId,
          processor,
          chatProcessId,
          onEntries: ({ chatProcessId: cpid, entries }) => {
            orchestrationEventsState.emit({
              type: 'chat-output',
              processId: cpid,
              payload: { chatProcessId: cpid, entries },
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
            mainTailStopHandle = stop;
          })
          .catch((error: unknown) => {
            process.stderr.write(
              `chatMainSessionTailBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
            );
          });
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
      // Compose the original CLI-kill with a main-session tail stop. When the session is
      // torn down (user navigates away, chat-stop, etc.), both the CLI process AND the
      // file-tail watcher are cleaned up together.
      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId: chatQuestId ?? questIdContract.parse(`chat-${processId}`),
          kill: () => {
            kill();
            if (mainTailStopHandle !== null) {
              mainTailStopHandle();
              mainTailStopHandle = null;
            }
          },
        },
      });
    },
  });
};
