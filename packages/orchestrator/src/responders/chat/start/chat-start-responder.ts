/**
 * PURPOSE: Starts a chat session by finding/creating quest, creating chaos work item, and kicking orchestration loop
 *
 * USAGE:
 * const { chatProcessId } = await ChatStartResponder({ guildId, message, sessionId });
 * // Creates chaos work item, kicks orchestration loop with userMessage
 */

import { getQuestInputContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type {
  ChatEntry,
  GuildId,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  SessionId,
} from '@dungeonmaster/shared/contracts';

import { chatMainSessionTailBroker } from '../../../brokers/chat/main-session-tail/chat-main-session-tail-broker';
import { chatSpawnBroker } from '../../../brokers/chat/spawn/chat-spawn-broker';
import { chatSubagentTailBroker } from '../../../brokers/chat/subagent-tail/chat-subagent-tail-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { workItemRoleContract } from '@dungeonmaster/shared/contracts';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { pendingClarificationState } from '../../../state/pending-clarification/pending-clarification-state';
import type { ClarificationQuestion } from '../../../contracts/clarification-question/clarification-question-contract';
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

  const processor = chatLineProcessTransformer();
  const subagentHandles: { stop: () => void; initialDrain: Promise<void> }[] = [];
  // Tracks broker setup promises that haven't resolved yet. Without this, onComplete can
  // fire and emit chat-complete BEFORE the broker has even set up the file watcher —
  // any sub-agent entries it would later deliver are then orphaned past chat-complete on
  // the wire. onComplete awaits this set so every detected sub-agent's drain runs to
  // completion before chat-complete is announced. Setups remove themselves when they
  // settle (success OR failure), so the set drains naturally.
  const inflightSubagentSetups = new Set<Promise<void>>();
  // Post-exit tail handle for the MAIN session JSONL. Populated on `onComplete` when we
  // have a session ID — catches background-agent task-notifications appended after stdout
  // closes (Claude CLI writes them async). Stopped when the session's process is killed.
  let mainTailStopHandle: (() => void) | null = null;
  // Sub-agent tails for `run_in_background` Tasks must keep delivering entries past parent
  // CLI exit — Claude CLI writes the agent's JSONL while the parent is asleep. Stopping
  // the watchers in `onComplete` would kill them before the background agent has finished
  // writing. Tails are torn down only when the chat itself is torn down (user navigates
  // away, /chat/stop, a new chat replaces this one) via the composed kill handlers below.

  const spawnResult = await chatSpawnBroker({
    role: workItemRoleContract.parse('chaoswhisperer'),
    guildId,
    message,
    processor,
    ...(sessionId && { sessionId }),
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
    onAgentDetected: ({ chatProcessId, agentId, sessionId: sid }) => {
      // Track the setup so onComplete can await it. The .finally on the chain self-removes
      // the entry once the broker has either successfully pushed its handle OR errored
      // (the .catch above swallows the rejection so .finally always sees a resolved
      // chain). Self-removal keeps the set bounded across long-lived sessions.
      const setup = chatSubagentTailBroker({
        sessionId: sid,
        guildId,
        agentId,
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpid, entries }) => {
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId: cpid,
            payload: {
              chatProcessId: cpid,
              entries,
              ...(chatQuestId === null ? {} : { questId: chatQuestId }),
              ...(chatWorkItemId === null ? {} : { workItemId: chatWorkItemId }),
            },
          });
        },
      })
        .then((handle) => {
          subagentHandles.push(handle);
        })
        .catch((error: unknown) => {
          process.stderr.write(
            `chatSubagentTailBroker failed: ${error instanceof Error ? error.message : String(error)}\n`,
          );
        })
        .finally(() => {
          inflightSubagentSetups.delete(setup);
        });
      inflightSubagentSetups.add(setup);
    },
    onComplete: async ({ chatProcessId, exitCode, sessionId: sid }) => {
      // Wait for every in-flight broker setup to resolve. Only then is `subagentHandles`
      // populated with all handles; iterating earlier would skip brokers whose async
      // setup hadn't finished and silently leak them past chat-complete.
      if (inflightSubagentSetups.size > 0) {
        await Promise.all(Array.from(inflightSubagentSetups));
      }
      // Wait for each tail's pre-existing-content drain to deliver every line via
      // onEntries before chat-complete fires. Without this, the synthetic-emit drain's
      // queued readline 'line' events would race chat-complete on the wire — clients
      // could see chat-complete before the sub-agent's already-on-disk lines arrive.
      // The tails are NOT stopped here — for `run_in_background` Tasks the parent CLI
      // exits while Claude CLI is still writing the agent's JSONL. The watchers stay
      // alive past chat-complete and are torn down via the chat-process kill below.
      if (subagentHandles.length > 0) {
        await Promise.all(subagentHandles.map(async (h) => h.initialDrain));
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
              payload: {
                chatProcessId: cpid,
                entries,
                ...(chatQuestId === null ? {} : { questId: chatQuestId }),
                ...(chatWorkItemId === null ? {} : { workItemId: chatWorkItemId }),
              },
            });
          },
        })
          .then((stop) => {
            mainTailStopHandle = stop;
            // Re-register the process with the post-exit teardown surface: the main-session
            // tail AND any still-alive sub-agent tails. The CLI process has already exited;
            // we keep the registry entry so any subsequent chat on the same quest (e.g. a
            // second user message via --resume) can find and kill these tails before
            // starting. Without this, the tails keep running and pick up JSONL lines
            // written by the new chat process, causing duplicate chat-output events on
            // the client. Sub-agent tails specifically must survive parent-CLI exit so
            // `run_in_background` agents can continue delivering streamed entries — see
            // the lifecycle comment near `subagentHandles`.
            orchestrationProcessesState.register({
              orchestrationProcess: {
                processId: chatProcessId,
                questId: chatQuestId ?? questIdContract.parse(`chat-${chatProcessId}`),
                kill: () => {
                  stop();
                  mainTailStopHandle = null;
                  for (const handle of subagentHandles) {
                    handle.stop();
                  }
                  subagentHandles.length = 0;
                },
              },
            });
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
        payload: {
          chatProcessId,
          exitCode,
          sessionId: sid,
          ...(chatQuestId === null ? {} : { questId: chatQuestId }),
          ...(chatWorkItemId === null ? {} : { workItemId: chatWorkItemId }),
        },
      });
    },
    registerProcess: ({ processId, kill }) => {
      // Compose the CLI kill with the file-watcher teardown. When the session is torn
      // down (user navigates away, chat-stop, etc.), the CLI process, the post-exit main
      // tail, AND every sub-agent tail are cleaned up together. Sub-agent tails are
      // included here because they outlive parent CLI exit (see the lifecycle comment
      // near `subagentHandles`) — without this stop, a `run_in_background` agent's
      // watcher would leak past chat teardown and start delivering entries to a stale
      // chat process.
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
            for (const handle of subagentHandles) {
              handle.stop();
            }
            subagentHandles.length = 0;
          },
        },
      });
    },
  });

  return {
    chatProcessId: spawnResult.chatProcessId,
    ...(chatQuestId === null ? {} : { questId: chatQuestId }),
  };
};
