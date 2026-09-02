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
  PastedImageUpload,
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
import {
  isPostQuestChatWorkItemRoleGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { rxjsFilterAdapter } from '../../adapters/rxjs/filter/rxjs-filter-adapter';
import { questChatBroker } from '../../brokers/quest/chat/quest-chat-broker';
import { questClarifyBroker } from '../../brokers/quest/clarify/quest-clarify-broker';
import { questCommentBatchBroker } from '../../brokers/quest/comment-batch/quest-comment-batch-broker';
import { questFollowupBroker } from '../../brokers/quest/followup/quest-followup-broker';
import { questFollowupStopBroker } from '../../brokers/quest/followup-stop/quest-followup-stop-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { commentBatchSendResultContract } from '../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentBatchSendResult } from '../../contracts/comment-batch-send-result/comment-batch-send-result-contract';
import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import type { QuestLoadFailedPayload } from '../../contracts/quest-load-failed-payload/quest-load-failed-payload-contract';
import { slotIndexContract } from '@dungeonmaster/shared/contracts';
import type { SlotIndex } from '@dungeonmaster/shared/contracts';
import type { UploadProgressHandler } from '../../contracts/upload-progress-post/upload-progress-post-contract';
import { hasEquivalentChatEntryGuard } from '../../guards/has-equivalent-chat-entry/has-equivalent-chat-entry-guard';
import { hasPendingQuestionGuard } from '../../guards/has-pending-question/has-pending-question-guard';
import { isTrackedChatProcessGuard } from '../../guards/is-tracked-chat-process/is-tracked-chat-process-guard';
import { pastedImageMemoryState } from '../../state/pasted-image-memory/pasted-image-memory-state';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { dataUrlBuildTransformer } from '../../transformers/data-url-build/data-url-build-transformer';
import { deriveSortedChatEntriesMapTransformer } from '../../transformers/derive-sorted-chat-entries-map/derive-sorted-chat-entries-map-transformer';
import { extractAskUserQuestionTransformer } from '../../transformers/extract-ask-user-question/extract-ask-user-question-transformer';
import { replaceEpochChatEntryTimestampTransformer } from '../../transformers/replace-epoch-chat-entry-timestamp/replace-epoch-chat-entry-timestamp-transformer';
import { sortChatEntriesByTimestampTransformer } from '../../transformers/sort-chat-entries-by-timestamp/sort-chat-entries-by-timestamp-transformer';
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
  followupEntries: ChatEntry[];
  quest: Quest | null;
  loadError: QuestLoadFailedPayload['error'] | null;
  pendingClarification: { questions: AskUserQuestionItem[] } | null;
  isStreaming: boolean;
  isFollowupStreaming: boolean;
  armStreaming: () => void;
  disarmStreaming: () => void;
  disarmFollowupStreaming: () => void;
  sendMessage: (params: {
    message: UserInput;
    images?: readonly PastedImageUpload[];
    onProgress?: UploadProgressHandler;
  }) => Promise<void>;
  sendFollowupMessage: (params: {
    message: UserInput;
    images?: readonly PastedImageUpload[];
    onProgress?: UploadProgressHandler;
  }) => Promise<void>;
  sendCommentBatch: (params: {
    comments: readonly CommentQueueEntry[];
  }) => Promise<CommentBatchSendResult>;
  submitClarifyAnswers: (params: {
    answers: { header: string; label: string }[];
    questions: AskUserQuestionItem[];
  }) => void;
  stopChat: () => void;
  stopFollowupChat: () => void;
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
  // Optimistic entries for the FOLLOW-UP tab's tavernkeeper conversation, kept OUT of
  // entriesBySessionInternal on purpose: the main composer is not mounted during the execution
  // phase (blocked/complete/merged), so bleeding a followup entry into the synthetic no-session
  // bucket sendMessage owns would surface it on a composer the user never touched.
  const [followupLocalEntries, setFollowupLocalEntries] = useState<ChatEntry[]>([]);
  // Two halves of "a turn is running", because they end on different signals.
  // `pendingTurn` is armed the instant the USER commits a turn (send / clarify answer / comment
  // batch / the first message that creates the quest) and is cleared ONLY by a real `turn-ended`.
  // It exists because there is a multi-second window between committing a turn and the agent's
  // first token, and the quest's own replay drains inside that window.
  // `streamingFromOutput` tracks the agent actually emitting, and clears on ANY stream end.
  const [pendingTurn, setPendingTurn] = useState(false);
  const [streamingFromOutput, setStreamingFromOutput] = useState(false);
  const isStreaming = pendingTurn || streamingFromOutput;

  // The SAME two halves again, for the FOLLOW-UP tab's tavernkeeper conversation. It is a separate
  // pair rather than a share of the one above because they answer different questions: `isStreaming`
  // is "is anything on this quest running", and the follow-up composer needs "is MY agent running".
  // Wiring that composer to the quest-global flag meant any work item's output — or, before replay
  // frames stopped arming it, the subscribe-quest replay itself — showed STOP over a tavernkeeper
  // that was not running and that the user had not spoken to yet.
  //
  // Mirrored rather than generalised into a per-work-item map on purpose: the main pair's exact
  // arm/disarm timing is load-bearing (see the two failure modes in packages/web/CLAUDE.md), and a
  // shared structure would have re-derived it for both. Every line of the main path below is
  // unchanged; the follow-up arms sit alongside it.
  const [followupPendingTurn, setFollowupPendingTurn] = useState(false);
  const [followupStreamingFromOutput, setFollowupStreamingFromOutput] = useState(false);
  const isFollowupStreaming = followupPendingTurn || followupStreamingFromOutput;

  // The synthetic (__no_session__) bucket holds every optimistic entry sendMessage/
  // sendFollowupMessage stage before a real sessionId exists for the turn. Once the replayed copy
  // lands in a REAL session's bucket, the synthetic copy has to fall out of the map or both render.
  // Filtered HERE, in the memo, rather than in a widget: this map has two independent consumers —
  // QuestChatContentLayerWidget's own flatten of every bucket into one transcript, and
  // ExecutionPanelWidget's per-row `sessionEntries` fallback lookup — and a widget-side filter would
  // have to be duplicated in both to cover them, with the second one easy to forget. This is the one
  // place both consumers share.
  const entriesBySession = useMemo(() => {
    const derived = deriveSortedChatEntriesMapTransformer({ source: entriesBySessionInternal });
    const optimistic = derived.get(SYNTHETIC_SESSION_KEY);
    if (optimistic === undefined) return derived;
    const delivered: ChatEntry[] = [];
    for (const [key, list] of derived) {
      if (key !== SYNTHETIC_SESSION_KEY) delivered.push(...list);
    }
    const survivors = optimistic.filter(
      (entry) => !hasEquivalentChatEntryGuard({ entry, among: delivered }),
    );
    const next = new Map(derived);
    next.set(SYNTHETIC_SESSION_KEY, survivors);
    return next;
  }, [entriesBySessionInternal]);
  const entriesByWorkItem = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: entriesByWorkItemInternal }),
    [entriesByWorkItemInternal],
  );
  const slotEntries = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: slotEntriesInternal }),
    [slotEntriesInternal],
  );

  // The FOLLOW-UP tab's transcript. Resolved from the tavernkeeper work item's own id via
  // entriesByWorkItem, NOT entriesBySession: FollowupChatStartResponder's live chat-output
  // payload carries workItemId but never sessionId (sessionId there is "informational only" —
  // routing is by questId+workItemId, the same convention chat-start-responder uses for the
  // create-surface composer). Only chatHistoryReplayBroker's replay payload adds sessionId, so
  // keying on sessionId rendered a reload's replay fine but never a turn actually streaming.
  // Local entries that replay has not echoed yet are filtered against the work item's own
  // entries the same way QuestChatContentLayerWidget's flattenedEntries dedupes the
  // create-surface composer.
  // The tavernkeeper's work item id — the FOLLOW-UP tab's routing key for BOTH its transcript and
  // its running state. `null` until the follow-up POST has minted the work item and the resulting
  // quest-modified has landed, which is precisely the window `followupPendingTurn` covers.
  const followupWorkItemId = useMemo<QuestWorkItemId | null>(
    () =>
      quest?.workItems.find((workItem) => isPostQuestChatWorkItemRoleGuard({ role: workItem.role }))
        ?.id ?? null,
    [quest],
  );

  const followupEntries = useMemo<ChatEntry[]>(() => {
    const workItemEntries =
      followupWorkItemId === null ? [] : (entriesByWorkItem.get(followupWorkItemId) ?? []);
    const localFiltered = followupLocalEntries.filter(
      (entry) => !hasEquivalentChatEntryGuard({ entry, among: workItemEntries }),
    );
    return sortChatEntriesByTimestampTransformer({
      entries: [...localFiltered, ...workItemEntries],
    });
  }, [followupWorkItemId, entriesByWorkItem, followupLocalEntries]);

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

  // The same handle for the FOLLOW-UP tab's turn, kept apart from the main composer's. A follow-up
  // POST writing the shared ref would retarget whichever turn the main composer had in flight, so
  // that turn's own completion would then read as foreign and never clear it.
  const followupTrackedChatProcessIdRef = useRef<ProcessId | null>(null);

  // Read by the chat-output subscription below, which is set up once per questId and cannot close
  // over a value that changes when the quest does.
  //
  // Written by the quest-updated handler at the moment the quest arrives, NOT synced on render.
  // The frame that mints the tavernkeeper work item and that work item's first chat-output can land
  // in the same React batch — no render happens between them — so a render-synced ref is still null
  // when the output it is meant to route arrives, and the composer misses the opening of its own
  // turn. Writing it on the wire closes that window.
  const followupWorkItemIdRef = useRef<QuestWorkItemId | null>(null);

  // Every chatProcessId that has already reported `turn-ended`. A spawned agent's transcript keeps
  // ARRIVING after its turn is over — the CLI writes its session JSONL at exit and the post-exit
  // tail replays those lines — so chat-output naming one of these processes is a transcript
  // draining, not an agent still emitting. Without this, that late output re-arms
  // `streamingFromOutput` for a process whose completion frame has already been and gone, and
  // nothing is left to clear it: the composer holds STOP forever and the user cannot send again.
  // Held as a ref, not state, because it must not re-render and must be readable by the
  // subscription closures below, which are set up once.
  const endedChatProcessIdsRef = useRef<Set<ProcessId>>(new Set<ProcessId>());

  // A pending turn belongs to the quest it was armed for. Carrying it across a real quest→quest
  // switch would show STOP over an idle workspace. The null→id transition is deliberately NOT a
  // switch: that is the same turn, whose first message just created its own quest.
  // followupLocalEntries is cleared on the same edge, and unlike the session buckets it HAS to be:
  // those are keyed by sessionId, so the next quest's follow-up transcript never reads another
  // quest's bucket, while these optimistic entries carry no key at all and would render the
  // previous quest's question in the new quest's FOLLOW-UP tab.
  const previousQuestIdRef = useRef<QuestId | null>(questId);
  useEffect(() => {
    const previousQuestId = previousQuestIdRef.current;
    previousQuestIdRef.current = questId;
    if (previousQuestId === null || previousQuestId === questId) return;
    setPendingTurn(false);
    setStreamingFromOutput(false);
    setFollowupLocalEntries([]);
    setFollowupPendingTurn(false);
    setFollowupStreamingFromOutput(false);
    trackedChatProcessIdRef.current = null;
    followupTrackedChatProcessIdRef.current = null;
    // The previous quest's tavernkeeper id must not route the next quest's output; the new quest's
    // own quest-modified rewrites it.
    followupWorkItemIdRef.current = null;
    endedChatProcessIdsRef.current = new Set<ProcessId>();
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

      // Entries are upserted above whatever this decides — a drained transcript still has to
      // RENDER; it just must not claim the agent is still working.
      //
      // A REPLAYED frame is a transcript read back off disk (ChatReplayResponder stamps it), so it
      // never arms the indicator. Subscribe-quest replays EVERY work item and each one ends with
      // its own `chat-history-complete`, so without this arm→disarm alternates once per work item:
      // a 31-item quest strobed the FOLLOW-UP composer SEND↔STOP ~35 times in under three seconds
      // while nothing was running. Gating on the flag rather than on the `quest-replay-` process-id
      // prefix keeps the server's id-naming convention out of the browser.
      if (payload.replay === true) return;

      const outputChatProcessId = payload.chatProcessId;
      if (
        outputChatProcessId !== undefined &&
        endedChatProcessIdsRef.current.has(outputChatProcessId)
      ) {
        return;
      }

      setStreamingFromOutput(true);

      // The follow-up composer arms only on ITS OWN agent's output. Routing by workItemId rather
      // than by chatProcessId is what makes this work across a reload: a replayed-then-resumed
      // tavernkeeper turn arrives under a process id this browser never issued, but the work item
      // is stamped on the quest and survives.
      const followupWorkItemIdNow = followupWorkItemIdRef.current;
      if (followupWorkItemIdNow !== null && workItemKey === followupWorkItemIdNow) {
        setFollowupStreamingFromOutput(true);
      }
    });

    const chatStreamEndedSub = rxjsFilterAdapter({
      source: webSocketChannelState.chatStreamEnded$(),
      // Scoped the same way the chatOutput$ predicate above it already is. A completion naming a
      // DIFFERENT process than the one this binding is tracking is somebody else's turn ending —
      // a sibling work item finishing, another browser's replay draining — and letting it through
      // is what made the control read PLAY while this quest's harness was still working. An
      // untracked turn (`null`) or an untagged payload falls through, same as chatOutputSub's own
      // "no id to compare against" arm.
      //
      // TWO tracked turns now, so the filter admits a frame either one claims and each arm re-tests
      // its own below. Filtering on the main handle alone would have dropped the tavernkeeper's own
      // completion whenever the main composer had a turn in flight, leaving the FOLLOW-UP tab on
      // STOP with nothing left to clear it.
      predicate: (p) =>
        isTrackedChatProcessGuard({
          chatProcessId: p.chatProcessId,
          trackedChatProcessId: trackedChatProcessIdRef.current,
        }) ||
        isTrackedChatProcessGuard({
          chatProcessId: p.chatProcessId,
          trackedChatProcessId: followupTrackedChatProcessIdRef.current,
        }),
    }).subscribe((payload): void => {
      if (
        isTrackedChatProcessGuard({
          chatProcessId: payload.chatProcessId,
          trackedChatProcessId: trackedChatProcessIdRef.current,
        })
      ) {
        setStreamingFromOutput(false);
        // Only a real turn end disarms. `history-replayed` is the subscribe-quest replay draining,
        // which fires a couple hundred ms after this binding attaches to a quest — disarming on it
        // would report a turn the user just started as idle.
        if (payload.reason === 'turn-ended') {
          setPendingTurn(false);
          trackedChatProcessIdRef.current = null;
          if (payload.chatProcessId !== undefined) {
            endedChatProcessIdsRef.current.add(payload.chatProcessId);
          }
        }
      }

      if (
        isTrackedChatProcessGuard({
          chatProcessId: payload.chatProcessId,
          trackedChatProcessId: followupTrackedChatProcessIdRef.current,
        })
      ) {
        setFollowupStreamingFromOutput(false);
        if (payload.reason === 'turn-ended') {
          setFollowupPendingTurn(false);
          followupTrackedChatProcessIdRef.current = null;
        }
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
      followupWorkItemIdRef.current =
        questParsed.data.workItems.find((workItem) =>
          isPostQuestChatWorkItemRoleGuard({ role: workItem.role }),
        )?.id ?? null;
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
    async ({
      message,
      images,
      onProgress,
    }: {
      message: UserInput;
      images?: readonly PastedImageUpload[];
      onProgress?: UploadProgressHandler;
    }): Promise<void> => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return Promise.resolve();

      const userEntry = chatEntryContract.parse({
        role: 'user',
        content: message,
        uuid: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
      // The staged entry's content is bare `[Pasted Image N]` placeholders — no bytes, no URL. The
      // renderer resolves each placeholder against this memory, keyed by the staged entry's own
      // uuid, so the optimistic bubble can draw the pasted image before the server round-trip and
      // its replayed copy (a DIFFERENT uuid) ever land.
      if (images !== undefined && images.length > 0) {
        pastedImageMemoryState.remember({
          uuid: userEntry.uuid,
          dataUrls: images.map((image) =>
            dataUrlBuildTransformer({ mediaType: image.mediaType, dataBase64: image.dataBase64 }),
          ),
        });
      }
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

      return resumeStep
        .then(async () =>
          questChatBroker({
            questId: activeQuestId,
            message,
            ...(images === undefined ? {} : { images }),
            ...(onProgress === undefined ? {} : { onProgress }),
          }),
        )
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
          // The composer is the thing that toasts the server's own rejection text and restores the
          // user's text and thumbnails — it can only do that if this promise rejects. Do not swallow
          // this, do not wrap it: the caller must see the exact error the broker threw.
          throw err;
        });
    },
    [quest],
  );

  // Mirrors sendMessage's shape for the FOLLOW-UP tab's tavernkeeper conversation. Three
  // deliberate divergences: the optimistic entry lands in followupLocalEntries, never
  // entriesBySessionInternal (see followupLocalEntries above); the running state armed is the
  // FOLLOW-UP pair, so the main composer is not told a turn it does not own is in flight; and there
  // is no resume-if-paused step, because the tavernkeeper only ever runs against a quest that has
  // already left the execution phase (blocked/complete/merged) — that step exists for sendMessage's
  // relay composer and has no quest state to resume from here.
  const sendFollowupMessage = useCallback(
    async ({
      message,
      images,
      onProgress,
    }: {
      message: UserInput;
      images?: readonly PastedImageUpload[];
      onProgress?: UploadProgressHandler;
    }): Promise<void> => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return Promise.resolve();

      const userEntry = chatEntryContract.parse({
        role: 'user',
        content: message,
        uuid: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      });
      // Same reasoning as sendMessage's own remember: the staged entry's content is bare
      // placeholders, so the renderer needs the bytes stashed under this entry's own uuid to draw
      // the optimistic bubble.
      if (images !== undefined && images.length > 0) {
        pastedImageMemoryState.remember({
          uuid: userEntry.uuid,
          dataUrls: images.map((image) =>
            dataUrlBuildTransformer({ mediaType: image.mediaType, dataBase64: image.dataBase64 }),
          ),
        });
      }
      setFollowupLocalEntries((prev) => [...prev, userEntry]);
      setFollowupPendingTurn(true);
      // The previous turn's handle must not outlive it: a late completion for THAT process would
      // otherwise match and clear the turn just committed.
      followupTrackedChatProcessIdRef.current = null;

      return questFollowupBroker({
        questId: activeQuestId,
        message,
        ...(images === undefined ? {} : { images }),
        ...(onProgress === undefined ? {} : { onProgress }),
      })
        .then(({ chatProcessId }) => {
          followupTrackedChatProcessIdRef.current = chatProcessId;
        })
        .catch((err: unknown) => {
          setFollowupPendingTurn(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
            uuid: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          });
          setFollowupLocalEntries((prev) => [...prev, errorEntry]);
          // Same contract as sendMessage's catch: the FOLLOW-UP composer toasts and restores from
          // this rejection, so it must actually reject rather than resolve quietly.
          throw err;
        });
    },
    [],
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

  // The FOLLOW-UP tab's STOP goes to its OWN endpoint, never questPauseBroker. Pause is a
  // quest-level halt: it kills every process on the quest and flips status to `paused`. A
  // follow-up chat only runs on a quest that is already blocked/complete/merged, and
  // `questStatusTransitionsStatics` makes that flip illegal from `complete` and `merged` (so the
  // pause failed AFTER killing) and legal from `blocked` — where it silently took the whole quest
  // and the FOLLOW-UP tab with it, since `paused` is not follow-up-chatable.
  const stopFollowupChat = useCallback((): void => {
    const activeQuestId = questIdRef.current;
    if (!activeQuestId) return;
    questFollowupStopBroker({ questId: activeQuestId }).catch(() => {
      setFollowupPendingTurn(false);
      setFollowupStreamingFromOutput(false);
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

  // The FOLLOW-UP tab's STOP. Same reason disarmStreaming exists for the main composer: a STOP
  // pressed before the tavernkeeper ever emitted has no turn end coming, so waiting for the wire
  // would hold the control on STOP forever. Pointing that button at disarmStreaming instead would
  // clear the MAIN composer's flag and leave the follow-up one armed — the same stuck control, one
  // indirection further away.
  const disarmFollowupStreaming = useCallback((): void => {
    setFollowupPendingTurn(false);
    setFollowupStreamingFromOutput(false);
  }, []);

  return {
    entriesBySession,
    entriesByWorkItem,
    slotEntries,
    followupEntries,
    quest,
    loadError,
    pendingClarification,
    isStreaming,
    isFollowupStreaming,
    armStreaming,
    disarmStreaming,
    disarmFollowupStreaming,
    sendMessage,
    sendFollowupMessage,
    sendCommentBatch,
    submitClarifyAnswers,
    stopChat,
    stopFollowupChat,
  };
};
