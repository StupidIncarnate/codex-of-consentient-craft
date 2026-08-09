/**
 * PURPOSE: React hook that owns the live quest workspace WebSocket lifecycle, accumulates per-workitem chat entries (uuid-keyed for dedup, timestamp-sorted on read), and exposes message/clarify/stop actions keyed by questId
 *
 * USAGE:
 * const { entriesBySession, quest, pendingClarification, isStreaming, sendMessage, submitClarifyAnswers, stopChat } = useQuestChatBinding({ questId });
 * // Subscribes to webSocketChannelState observables on mount, sends subscribe-quest when opens$ fires, accumulates entries by sessionId
 * // (uuid-keyed Map internally, sorted ChatEntry[] in the public surface), returns reactive state
 *
 * The internal Map<EntryUuid, ChatEntry> per session collapses duplicate emissions from the
 * dual-source convergence (parent stdout + sub-agent JSONL tail) — both sources stamp the same
 * uuid for the same content, so last-write-wins yields one entry per uuid. The exposed
 * Map<SessionId, ChatEntry[]> is derived by sorting on (timestamp, uuid) so streaming and replay
 * paths render identical DOM regardless of arrival order.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  AskUserQuestionItem,
  ChatEntry,
  ChatEntryUuid,
  ProcessId,
  Quest,
  QuestId,
  QuestWorkItemId,
  SessionId,
  UserInput,
} from '@dungeonmaster/shared/contracts';
import {
  askUserQuestionContract,
  chatEntryContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import { isUserPausedQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { rxjsFilterAdapter } from '../../adapters/rxjs/filter/rxjs-filter-adapter';
import { questChatBroker } from '../../brokers/quest/chat/quest-chat-broker';
import { questClarifyBroker } from '../../brokers/quest/clarify/quest-clarify-broker';
import { questCommentBatchBroker } from '../../brokers/quest/comment-batch/quest-comment-batch-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { commentBatchSendResultContract } from '../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentBatchSendResult } from '../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import type { QuestLoadFailedPayload } from '../../contracts/quest-load-failed-payload/quest-load-failed-payload-contract';
import { slotIndexContract } from '@dungeonmaster/shared/contracts';
import type { SlotIndex } from '@dungeonmaster/shared/contracts';
import { hasPendingQuestionGuard } from '../../guards/has-pending-question/has-pending-question-guard';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { deriveSortedChatEntriesMapTransformer } from '../../transformers/derive-sorted-chat-entries-map/derive-sorted-chat-entries-map-transformer';
import { extractAskUserQuestionTransformer } from '../../transformers/extract-ask-user-question/extract-ask-user-question-transformer';
import { replaceEpochChatEntryTimestampTransformer } from '../../transformers/replace-epoch-chat-entry-timestamp/replace-epoch-chat-entry-timestamp-transformer';
import { upsertChatEntriesByUuidTransformer } from '../../transformers/upsert-chat-entries-by-uuid/upsert-chat-entries-by-uuid-transformer';

const SYNTHETIC_SESSION_KEY = '__no_session__' as SessionId;

export const useQuestChatBinding = ({
  questId,
}: {
  questId: QuestId | null;
}): {
  entriesBySession: Map<SessionId, ChatEntry[]>;
  entriesByWorkItem: Map<QuestWorkItemId, ChatEntry[]>;
  slotEntries: Map<SlotIndex, ChatEntry[]>;
  quest: Quest | null;
  loadError: QuestLoadFailedPayload['error'] | null;
  pendingClarification: { questions: AskUserQuestionItem[] } | null;
  isStreaming: boolean;
  armStreaming: () => void;
  disarmStreaming: () => void;
  sendMessage: (params: { message: UserInput }) => void;
  sendCommentBatch: (params: {
    comments: readonly CommentQueueEntry[];
  }) => Promise<CommentBatchSendResult>;
  submitClarifyAnswers: (params: {
    answers: { header: string; label: string }[];
    questions: AskUserQuestionItem[];
  }) => void;
  stopChat: () => void;
} => {
  const [entriesBySessionInternal, setEntriesBySessionInternal] = useState<
    Map<SessionId, Map<ChatEntryUuid, ChatEntry>>
  >(new Map());
  // Parallel bucket keyed by workItemId. Sibling Task-dispatched sub-agents share one
  // parent sessionId, so the sessionId bucket alone can't tell two codeweaver rows apart;
  // the execution panel reads this map (keyed by wi.id) to scope each row's transcript.
  // Only populated for emits that carry workItemId (replay + live sub-agent tails).
  const [entriesByWorkItemInternal, setEntriesByWorkItemInternal] = useState<
    Map<QuestWorkItemId, Map<ChatEntryUuid, ChatEntry>>
  >(new Map());
  const [slotEntriesInternal, setSlotEntriesInternal] = useState<
    Map<SlotIndex, Map<ChatEntryUuid, ChatEntry>>
  >(new Map());
  const [quest, setQuest] = useState<Quest | null>(null);
  // The server's field-level reason when this quest's read failed. Held alongside `quest` rather
  // than folded into it, because a route that only knows "no quest yet" cannot tell a load still in
  // flight from one that has definitively failed.
  const [loadError, setLoadError] = useState<QuestLoadFailedPayload['error'] | null>(null);
  const [pendingClarification, setPendingClarification] = useState<{
    questions: AskUserQuestionItem[];
  } | null>(null);
  // Two halves of "a turn is running", because they end on different signals.
  // `pendingTurn` is armed the instant the USER commits a turn (send / clarify answer / comment
  // batch / the first message that creates the quest) and is cleared ONLY by a real `turn-ended`.
  // It exists because there is a multi-second window between committing a turn and the agent's
  // first token, and the quest's own replay drains inside that window.
  // `streamingFromOutput` tracks the agent actually emitting, and clears on ANY stream end.
  const [pendingTurn, setPendingTurn] = useState(false);
  const [streamingFromOutput, setStreamingFromOutput] = useState(false);
  const isStreaming = pendingTurn || streamingFromOutput;

  const entriesBySession = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: entriesBySessionInternal }),
    [entriesBySessionInternal],
  );
  const entriesByWorkItem = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: entriesByWorkItemInternal }),
    [entriesByWorkItemInternal],
  );
  const slotEntries = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: slotEntriesInternal }),
    [slotEntriesInternal],
  );

  const questIdRef = useRef<QuestId | null>(questId);
  questIdRef.current = questId;

  // Track the questId that was active at subscribe time so cleanup sends the correct id
  const subscribedQuestIdRef = useRef<QuestId | null>(null);

  // The chatProcessId of the turn the running state is tracking, learned from whichever send
  // dispatched it. Every completion frame names the process it belongs to, so a foreign one — a
  // sibling work item finishing, another browser's replay draining — can be ignored instead of
  // reporting this quest's in-flight turn as idle. `null` means "armed with no handle yet": the
  // first message, which must create its quest before there is a questId to POST to, and the
  // sub-second window between committing a turn and its POST resolving. An untracked turn falls
  // back to clearing on any `turn-ended`, which is what keeps a turn that emits nothing from
  // sticking on STOP forever.
  const trackedChatProcessIdRef = useRef<ProcessId | null>(null);

  // A pending turn belongs to the quest it was armed for. Carrying it across a real quest→quest
  // switch would show STOP over an idle workspace. The null→id transition is deliberately NOT a
  // switch: that is the same turn, whose first message just created its own quest.
  const previousQuestIdRef = useRef<QuestId | null>(questId);
  useEffect(() => {
    const previousQuestId = previousQuestIdRef.current;
    previousQuestIdRef.current = questId;
    if (previousQuestId === null || previousQuestId === questId) return;
    setPendingTurn(false);
    setStreamingFromOutput(false);
    trackedChatProcessIdRef.current = null;
  }, [questId]);

  useEffect(() => {
    const opensSub = webSocketChannelState.opens$().subscribe((): void => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return;
      subscribedQuestIdRef.current = activeQuestId;
      webSocketChannelState.sendSubscribeQuest({ questId: activeQuestId });
    });

    const chatOutputSub = rxjsFilterAdapter({
      source: webSocketChannelState.chatOutput$(),
      // Only payloads addressed to the quest this binding is bound to. One browser tab per
      // quest shares a guild's server, so an untagged frame accepted here is another
      // quest's transcript rendering in this one's panel — and, because any accepted frame
      // arms `streamingFromOutput`, a quest sitting on an approval gate reporting itself as
      // streaming. The server resolves the owning quest before it delivers, so a frame that
      // reaches a quest subscription always carries its id.
      predicate: (p) => p.questId === questIdRef.current,
    }).subscribe((payload): void => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return;

      const rawEntries = payload.entries;
      if (!Array.isArray(rawEntries)) return;

      const validEntries: ChatEntry[] = [];
      const rejected: { candidate: unknown; reason: unknown }[] = [];
      for (const candidate of rawEntries as unknown[]) {
        const parseResult = chatEntryContract.safeParse(candidate);
        if (parseResult.success) {
          validEntries.push(replaceEpochChatEntryTimestampTransformer({ entry: parseResult.data }));
        } else {
          rejected.push({ candidate, reason: parseResult.error.issues });
        }
      }

      globalThis.console.log('[WS] chat-output', {
        questId: activeQuestId,
        sessionId: payload.sessionId ?? null,
        chatProcessId: payload.chatProcessId ?? null,
        slotIndex: payload.slotIndex ?? null,
        validCount: validEntries.length,
        rawCount: rawEntries.length,
        entries: validEntries.map((e) => ({
          role: e.role,
          type: 'type' in e ? e.type : null,
          toolName: 'toolName' in e ? String(e.toolName) : null,
          toolUseId: 'toolUseId' in e && e.toolUseId ? String(e.toolUseId) : null,
          agentId: 'agentId' in e && e.agentId ? String(e.agentId) : null,
          source: 'source' in e ? (e.source ?? null) : null,
          content: 'content' in e && typeof e.content === 'string' ? e.content : null,
          uuid: String(e.uuid),
          timestamp: String(e.timestamp),
        })),
      });
      if (rejected.length > 0) {
        globalThis.console.warn('[WS] chat-output rejected-entries', rejected);
      }

      if (validEntries.length === 0) return;

      const sessionKey = payload.sessionId ?? SYNTHETIC_SESSION_KEY;
      setEntriesBySessionInternal((prev) =>
        upsertChatEntriesByUuidTransformer({ prev, key: sessionKey, newEntries: validEntries }),
      );

      const workItemKey = payload.workItemId;
      if (workItemKey !== undefined) {
        setEntriesByWorkItemInternal((prev) =>
          upsertChatEntriesByUuidTransformer({ prev, key: workItemKey, newEntries: validEntries }),
        );
      }

      const slotIndexParsed = slotIndexContract.safeParse(payload.slotIndex);
      if (slotIndexParsed.success) {
        const slotKey = slotIndexParsed.data;
        setSlotEntriesInternal((prev) =>
          upsertChatEntriesByUuidTransformer({ prev, key: slotKey, newEntries: validEntries }),
        );
      }

      setStreamingFromOutput(true);
    });

    const chatStreamEndedSub = rxjsFilterAdapter({
      source: webSocketChannelState.chatStreamEnded$(),
      // Scoped the same way the chatOutput$ predicate above it already is. A completion naming a
      // DIFFERENT process than the one this binding is tracking is somebody else's turn ending —
      // a sibling work item finishing, another browser's replay draining — and letting it through
      // is what made the control read PLAY while this quest's harness was still working. An
      // untracked turn (`null`) or an untagged payload falls through, same as chatOutputSub's own
      // "no id to compare against" arm.
      predicate: (p) =>
        trackedChatProcessIdRef.current === null ||
        p.chatProcessId === undefined ||
        p.chatProcessId === trackedChatProcessIdRef.current,
    }).subscribe((payload): void => {
      setStreamingFromOutput(false);
      // Only a real turn end disarms. `history-replayed` is the subscribe-quest replay draining,
      // which fires a couple hundred ms after this binding attaches to a quest — disarming on it
      // would report a turn the user just started as idle.
      if (payload.reason === 'turn-ended') {
        setPendingTurn(false);
        trackedChatProcessIdRef.current = null;
      }
    });

    const clarificationRequestSub = webSocketChannelState
      .clarificationRequest$()
      .subscribe((payload): void => {
        const result = askUserQuestionContract.safeParse({
          questions: payload.questions,
        });
        if (!result.success) return;
        setPendingClarification({ questions: result.data.questions });
      });

    const questUpdatedSub = rxjsFilterAdapter({
      source: webSocketChannelState.questUpdated$(),
      predicate: (q) => q.id === questIdRef.current,
    }).subscribe((updatedQuest): void => {
      const questParsed = questContract.safeParse(updatedQuest);
      if (!questParsed.success) return;
      setQuest(questParsed.data);
      // A quest that now parses supersedes any earlier failure, so the route stops reporting a
      // failure it has already recovered from.
      setLoadError(null);
    });

    const questLoadFailedSub = rxjsFilterAdapter({
      source: webSocketChannelState.questLoadFailed$(),
      predicate: (p) => p.questId === questIdRef.current,
    }).subscribe((payload): void => {
      setLoadError(payload.error);
    });

    return (): void => {
      opensSub.unsubscribe();
      chatOutputSub.unsubscribe();
      chatStreamEndedSub.unsubscribe();
      clarificationRequestSub.unsubscribe();
      questUpdatedSub.unsubscribe();
      questLoadFailedSub.unsubscribe();

      const subscribedQuestId = subscribedQuestIdRef.current;
      if (subscribedQuestId) {
        webSocketChannelState.sendUnsubscribeQuest({ questId: subscribedQuestId });
        subscribedQuestIdRef.current = null;
      }
    };
  }, [questId]);

  // Reconcile pendingClarification from accumulated chat entries. The WS
  // clarification-request event only fires from the legacy chat-spawn-broker path; the
  // /dumpster-create flow tails the user's own Claude Code session JSONL via
  // quest-monitor-jsonl-watcher-broker which emits chat-output only. Scanning the entries
  // for an unanswered ask-user-question tool_use bridges that gap so the clarify panel
  // surfaces in both flows.
  useEffect(() => {
    let nextPending: { questions: AskUserQuestionItem[] } | null = null;
    for (const entries of entriesBySession.values()) {
      if (!hasPendingQuestionGuard({ entries })) continue;
      const extracted = extractAskUserQuestionTransformer({ entries });
      if (extracted !== null) {
        nextPending = { questions: extracted.questions };
        break;
      }
    }
    setPendingClarification(nextPending);
  }, [entriesBySession]);

  const sendMessage = useCallback(
    ({ message }: { message: UserInput }): void => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return;

      const userEntry = chatEntryContract.parse({
        role: 'user',
        content: message,
        uuid: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
      setEntriesBySessionInternal((prev) =>
        upsertChatEntriesByUuidTransformer({
          prev,
          key: SYNTHETIC_SESSION_KEY,
          newEntries: [userEntry],
        }),
      );
      setPendingTurn(true);
      setPendingClarification(null);
      // The previous turn's handle must not outlive it: a late completion for THAT process would
      // otherwise match and clear the turn just committed.
      trackedChatProcessIdRef.current = null;

      const currentQuest = quest;
      const needsResume =
        currentQuest !== null && isUserPausedQuestStatusGuard({ status: currentQuest.status });

      const resumeStep = needsResume
        ? questResumeBroker({ questId: activeQuestId })
        : Promise.resolve();

      resumeStep
        .then(async () => questChatBroker({ questId: activeQuestId, message }))
        .then(({ chatProcessId }) => {
          trackedChatProcessIdRef.current = chatProcessId;
        })
        .catch((err: unknown) => {
          setPendingTurn(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
            uuid: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          });
          setEntriesBySessionInternal((prev) =>
            upsertChatEntriesByUuidTransformer({
              prev,
              key: SYNTHETIC_SESSION_KEY,
              newEntries: [errorEntry],
            }),
          );
        });
    },
    [quest],
  );

  // Comment-batch send lives HERE rather than in the queue-bar widget because the panel entry is
  // this binding's job: Claude's --resume stream never echoes the prompt back, so a widget that
  // POSTs directly leaves the user's own message invisible until a reload replays the session from
  // disk. The synthetic entry uses the server's own rendered markdown, so it reads identically
  // before and after that reload.
  const sendCommentBatch = useCallback(
    async ({
      comments,
    }: {
      comments: readonly CommentQueueEntry[];
    }): Promise<CommentBatchSendResult> => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) {
        return commentBatchSendResultContract.parse({
          outcome: 'failed',
          error: 'No active quest to send comments to',
        });
      }

      const result = await questCommentBatchBroker({ questId: activeQuestId, comments });

      // Only a delivered batch becomes a chat entry. A stale (409) or failed batch reached no
      // agent, so rendering it would claim feedback was sent that never was.
      if (result.outcome === 'sent' && result.deliveredMessage !== undefined) {
        const userEntry = chatEntryContract.parse({
          role: 'user',
          content: result.deliveredMessage,
          uuid: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        });
        setEntriesBySessionInternal((prev) =>
          upsertChatEntriesByUuidTransformer({
            prev,
            key: SYNTHETIC_SESSION_KEY,
            newEntries: [userEntry],
          }),
        );
        setPendingTurn(true);
        setPendingClarification(null);
        trackedChatProcessIdRef.current = result.chatProcessId;
      }

      return result;
    },
    [],
  );

  const submitClarifyAnswers = useCallback(
    ({
      answers,
      questions,
    }: {
      answers: { header: string; label: string }[];
      questions: AskUserQuestionItem[];
    }): void => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return;

      const userMessage = answers.map((a) => `${a.header}: ${a.label}`).join('\n');
      const userEntry = chatEntryContract.parse({
        role: 'user',
        content: userMessage,
        uuid: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
      setEntriesBySessionInternal((prev) =>
        upsertChatEntriesByUuidTransformer({
          prev,
          key: SYNTHETIC_SESSION_KEY,
          newEntries: [userEntry],
        }),
      );
      setPendingTurn(true);
      setPendingClarification(null);
      trackedChatProcessIdRef.current = null;

      questClarifyBroker({
        questId: activeQuestId,
        answers,
        questions,
      })
        .then(({ chatProcessId }) => {
          trackedChatProcessIdRef.current = chatProcessId;
        })
        .catch((err: unknown) => {
          setPendingTurn(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
            uuid: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          });
          setEntriesBySessionInternal((prev) =>
            upsertChatEntriesByUuidTransformer({
              prev,
              key: SYNTHETIC_SESSION_KEY,
              newEntries: [errorEntry],
            }),
          );
        });
    },
    [],
  );

  const stopChat = useCallback((): void => {
    const activeQuestId = questIdRef.current;
    if (!activeQuestId) return;
    questPauseBroker({ questId: activeQuestId }).catch(() => {
      setPendingTurn(false);
    });
  }, []);

  // For the one turn this binding cannot POST itself: the first message, which must create its
  // quest before there is a questId to send to. The caller owns that round-trip, so it arms here
  // with no process handle and the wire disarms on `turn-ended` like any other turn.
  const armStreaming = useCallback((): void => {
    setPendingTurn(true);
    trackedChatProcessIdRef.current = null;
  }, []);

  const disarmStreaming = useCallback((): void => {
    setPendingTurn(false);
  }, []);

  return {
    entriesBySession,
    entriesByWorkItem,
    slotEntries,
    quest,
    loadError,
    pendingClarification,
    isStreaming,
    armStreaming,
    disarmStreaming,
    sendMessage,
    sendCommentBatch,
    submitClarifyAnswers,
    stopChat,
  };
};
