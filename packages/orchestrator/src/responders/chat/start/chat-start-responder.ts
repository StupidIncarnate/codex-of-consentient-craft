/**
 * PURPOSE: Starts a chat session by finding/creating quest, creating chaos work item, and kicking orchestration loop
 *
 * USAGE:
 * const { chatProcessId } = await ChatStartResponder({ guildId, message, sessionId });
 * // Creates chaos work item, kicks orchestration loop with userMessage
 */

import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type {
  ChatEntry,
  GuildId,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  SessionId,
} from '@dungeonmaster/shared/contracts';

import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { pendingClarificationState } from '../../../state/pending-clarification/pending-clarification-state';
import type { ClarificationQuestion } from '../../../contracts/clarification-question/clarification-question-contract';
import { streamJsonToClarificationTransformer } from '../../../transformers/stream-json-to-clarification/stream-json-to-clarification-transformer';

export const ChatStartResponder = async ({
  guildId,
  message,
  sessionId,
}: {
  guildId: GuildId;
  message: string;
  sessionId?: SessionId;
}): Promise<{ chatProcessId: ProcessId; questId?: QuestId }> => {
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
  let chatWorkItemId: QuestWorkItemId | null = null;

  if (sessionId) {
    try {
      const quests = await questListBroker({ guildId });
      const linkedQuest = quests.find((quest) =>
        quest.workItems.some((wi) => wi.sessionId === sessionId),
      );
      if (linkedQuest) {
        chatQuestId = linkedQuest.id;
        const matchedWorkItem = linkedQuest.workItems.find((wi) => wi.sessionId === sessionId);
        if (matchedWorkItem) {
          chatWorkItemId = matchedWorkItem.id;
        }
        process.stderr.write(
          `[CLARIFICATION-DEBUG] resumed session: found linked questId=${chatQuestId}\n`,
        );

        // Kill any prior chat process for this work item so its post-exit main-session
        // tail stops watching the JSONL before the new turn writes to it. Prefer
        // `findByQuestWorkItemId` (matches the launcher's per-work-item registration)
        // and fall back to `findByQuestId` for processes registered without a work item
        // id (e.g. quest-level loop dispatchers, or the orchestration-start-responder's
        // synthetic placeholder).
        const runningProcess =
          chatWorkItemId === null
            ? orchestrationProcessesState.findByQuestId({ questId: chatQuestId })
            : (orchestrationProcessesState.findByQuestWorkItemId({
                questWorkItemId: chatWorkItemId,
              }) ?? orchestrationProcessesState.findByQuestId({ questId: chatQuestId }));
        if (runningProcess) {
          orchestrationProcessesState.kill({ processId: runningProcess.processId });
        }
      }
    } catch {
      // Quest lookup failure should not block chat startup
    }
  }

  // Buffer chat-output emits that arrive BEFORE chatWorkItemId is resolved. New-chat path:
  // chaoswhisperer work item is created by `questUserAddBroker` (inside `chatSpawnBroker`)
  // before stdout begins, but the workItem id is only knowable AFTER `onQuestCreated` fires
  // and a follow-up questGetBroker resolves the chaoswhisperer work item. The first stdout
  // lines may race ahead of that lookup. Buffering preserves ordering and guarantees every
  // chat-output emit carries questId+workItemId for routing.
  const chatOutputBuffer: { chatProcessId: ProcessId; entries: ChatEntry[] }[] = [];

  // Buffer clarification-request emits the same way. The server's per-quest broadcast
  // filter routes clarifications by `questId`; an emit that races `onQuestCreated` would
  // miss every subscribed client. Drains in parallel with chatOutputBuffer once chatQuestId
  // is known. Unlike chat-output, clarification only needs questId (not workItemId).
  const clarificationBuffer: {
    chatProcessId: ProcessId;
    questions: ClarificationQuestion[];
  }[] = [];

  // Forward-declared via a ref so the chatSpawnBroker callbacks below (defined inside
  // the call) can reach the per-spawn stream handle's `initialDrains()` from onComplete.
  // The ref is mutated immediately after the await resolves; the callbacks always fire
  // later than that. The post-exit main-session tail and its teardown live inside
  // `agentLaunchBroker` (started in its spawn-onComplete after CLI exit, stopped via the
  // composed kill it returns through registerProcess).
  type StreamHandle = Awaited<ReturnType<typeof chatSpawnBroker>>['handle'];
  const streamHandleRef: { current: StreamHandle | null } = { current: null };

  const spawnResult = await chatSpawnBroker({
    role: workItemRoleContract.parse('chaoswhisperer'),
    guildId,
    message,
    ...(sessionId && { sessionId }),
    // chatQuestId was resolved above via questListBroker when resuming. Required by
    // resolveChatQuestLayerBroker when sessionId is present so the resume path can
    // look up the chaoswhisperer work item for addressability.
    ...(chatQuestId !== null && { questId: chatQuestId }),
    onQuestCreated: ({ questId, chatProcessId }) => {
      chatQuestId = questId;
      // Resolve the chaoswhisperer work item id created by questUserAddBroker, then flush
      // any chat-output frames buffered while we were learning it. Fire-and-forget — any
      // buffered emits stay buffered until the lookup resolves; once chatWorkItemId is
      // set, the in-line flush below kicks in on the next onEntries call.
      questGetBroker({ input: getQuestInputContract.parse({ questId }) })
        .then((result) => {
          if (!result.success || !result.quest) return;
          const chaosItem = result.quest.workItems.find((wi) => wi.role === 'chaoswhisperer');
          if (chaosItem === undefined) return;
          chatWorkItemId = chaosItem.id;
          // Drain buffered chat-output emits now that questId+workItemId are both known.
          while (chatOutputBuffer.length > 0) {
            const buffered = chatOutputBuffer.shift();
            if (buffered === undefined) break;
            orchestrationEventsState.emit({
              type: 'chat-output',
              processId: buffered.chatProcessId,
              payload: {
                chatProcessId: buffered.chatProcessId,
                entries: buffered.entries,
                questId,
                workItemId: chaosItem.id,
              },
            });
          }
          // Drain buffered clarification-request emits. The server's per-quest broadcast
          // filter requires questId on every clarification payload — emits that raced
          // onQuestCreated stayed buffered until now and ship with questId stamped.
          while (clarificationBuffer.length > 0) {
            const bufferedClarification = clarificationBuffer.shift();
            if (bufferedClarification === undefined) break;
            orchestrationEventsState.emit({
              type: 'clarification-request',
              processId: bufferedClarification.chatProcessId,
              payload: {
                chatProcessId: bufferedClarification.chatProcessId,
                questions: bufferedClarification.questions,
                questId,
              },
            });
          }
          // Re-emit quest-session-linked now that we know workItemId, so subscribers can
          // correlate by workItemId in addition to questId.
          orchestrationEventsState.emit({
            type: 'quest-session-linked',
            processId: chatProcessId,
            payload: {
              questId,
              chatProcessId,
              workItemId: chaosItem.id,
              role: 'chaoswhisperer',
            },
          });
        })
        .catch((error: unknown) => {
          process.stderr.write(
            `[chat-start] chaoswhisperer work item lookup failed: ${String(error)}\n`,
          );
        });
      orchestrationEventsState.emit({
        type: 'quest-session-linked',
        processId: chatProcessId,
        payload: { questId, chatProcessId, role: 'chaoswhisperer' },
      });
    },
    onEntries: ({ chatProcessId, entries }) => {
      // sessionId surfaced by the handle is informational here — the responder's payload
      // routes by chatQuestId/chatWorkItemId, which are learned via onQuestCreated below.
      if (chatQuestId === null || chatWorkItemId === null) {
        chatOutputBuffer.push({ chatProcessId, entries });
      } else {
        // Drain anything that may have been buffered concurrently
        while (chatOutputBuffer.length > 0) {
          const buffered = chatOutputBuffer.shift();
          if (buffered === undefined) break;
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId: buffered.chatProcessId,
            payload: {
              chatProcessId: buffered.chatProcessId,
              entries: buffered.entries,
              questId: chatQuestId,
              workItemId: chatWorkItemId,
            },
          });
        }
        orchestrationEventsState.emit({
          type: 'chat-output',
          processId: chatProcessId,
          payload: {
            chatProcessId,
            entries,
            questId: chatQuestId,
            workItemId: chatWorkItemId,
          },
        });
      }

      for (const entry of entries) {
        if (entry.role !== 'assistant' || entry.type !== 'tool_use') continue;
        const clarification = streamJsonToClarificationTransformer({ entry });
        if (clarification) {
          process.stderr.write(
            `[CLARIFICATION-DEBUG] onEntries: clarification DETECTED with ${clarification.questions.length} questions, chatQuestId=${chatQuestId ?? 'NULL'}\n`,
          );
          if (chatQuestId === null || chatWorkItemId === null) {
            // Buffer until onQuestCreated resolves chatQuestId AND the chaoswhisperer
            // work-item lookup completes — same race window chat-output handles. The
            // drain in the questGetBroker .then() handler stamps questId on every entry
            // so the server's per-quest broadcast filter can route it.
            clarificationBuffer.push({
              chatProcessId,
              questions: clarification.questions,
            });
          } else {
            // Drain anything buffered concurrently before emitting this entry, mirroring
            // the inline drain pattern used for chat-output.
            while (clarificationBuffer.length > 0) {
              const bufferedClarification = clarificationBuffer.shift();
              if (bufferedClarification === undefined) break;
              orchestrationEventsState.emit({
                type: 'clarification-request',
                processId: bufferedClarification.chatProcessId,
                payload: {
                  chatProcessId: bufferedClarification.chatProcessId,
                  questions: bufferedClarification.questions,
                  questId: chatQuestId,
                },
              });
            }
            orchestrationEventsState.emit({
              type: 'clarification-request',
              processId: chatProcessId,
              payload: {
                chatProcessId,
                questions: clarification.questions,
                questId: chatQuestId,
              },
            });
          }

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
    onSessionIdExtracted: ({ chatProcessId, sessionId: sid }) => {
      orchestrationEventsState.emit({
        type: 'chat-session-started',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          sessionId: sid,
          ...(chatQuestId === null ? {} : { questId: chatQuestId }),
          ...(chatWorkItemId === null ? {} : { workItemId: chatWorkItemId }),
        },
      });
    },
    onComplete: async ({ chatProcessId, exitCode, sessionId: sid }) => {
      // Wait for every in-flight sub-agent broker setup AND each tail's pre-existing-
      // content drain to deliver via onEntries before chat-complete fires. Without this,
      // the synthetic-emit drain's queued readline 'line' events would race chat-complete
      // on the wire — clients could see chat-complete before the sub-agent's already-on-
      // disk lines arrive. The post-exit main-session tail (started by `agentLaunchBroker`
      // in its onComplete) keeps watching the JSONL past chat-complete to catch
      // background-agent task-notifications Claude CLI appends after exit; the launcher's
      // composed kill (registered via the registerProcess callback below) is the eventual
      // stopper.
      if (streamHandleRef.current !== null) {
        await streamHandleRef.current.initialDrains();
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

      orchestrationEventsState.emit({
        type: 'chat-complete',
        processId: chatProcessId,
        payload: {
          chatProcessId,
          exitCode,
          sessionId: sid,
          ...(chatQuestId === null ? {} : { questId: chatQuestId }),
          ...(chatWorkItemId === null ? {} : { workItemId: chatWorkItemId }),
        },
      });
    },
    registerProcess: ({ processId, questId: launcherQuestId, questWorkItemId, kill }) => {
      // Forward the launcher's composed kill (CLI spawn + handle stop + post-exit tail
      // stop) to the process registry. The launcher's questId+questWorkItemId are the
      // authoritative identity (resolved by `resolveChatQuestLayerBroker` and passed
      // synchronously into the launcher's registerProcess) — using them here means the
      // next turn's resume path's `findByQuestWorkItemId` can locate this process and
      // stop its lingering tail before the new turn writes to the same JSONL, even
      // though `chatQuestId`/`chatWorkItemId` in this responder's closure may not yet
      // be set (the `onQuestCreated`/`questGetBroker.then` chain runs AFTER the
      // synchronous launcher setup). Closure variables stay null here so the chat-
      // output buffer's race-prevention semantics keep working — early emits buffer
      // until `onQuestCreated` populates the closure.
      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId: launcherQuestId,
          questWorkItemId,
          kill,
        },
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

  streamHandleRef.current = spawnResult.handle;

  return {
    chatProcessId: spawnResult.chatProcessId,
    ...(chatQuestId === null ? {} : { questId: chatQuestId }),
  };
};
