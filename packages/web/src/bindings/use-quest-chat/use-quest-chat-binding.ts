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
  Quest,
  QuestId,
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
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { slotIndexContract } from '../../contracts/slot-index/slot-index-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { deriveSortedChatEntriesMapTransformer } from '../../transformers/derive-sorted-chat-entries-map/derive-sorted-chat-entries-map-transformer';
import { replaceEpochChatEntryTimestampTransformer } from '../../transformers/replace-epoch-chat-entry-timestamp/replace-epoch-chat-entry-timestamp-transformer';
import { upsertChatEntriesByUuidTransformer } from '../../transformers/upsert-chat-entries-by-uuid/upsert-chat-entries-by-uuid-transformer';

const SYNTHETIC_SESSION_KEY = '__no_session__' as SessionId;

export const useQuestChatBinding = ({
  questId,
}: {
  questId: QuestId | null;
}): {
  entriesBySession: Map<SessionId, ChatEntry[]>;
  slotEntries: Map<SlotIndex, ChatEntry[]>;
  quest: Quest | null;
  pendingClarification: { questions: AskUserQuestionItem[] } | null;
  isStreaming: boolean;
  sendMessage: (params: { message: UserInput }) => void;
  submitClarifyAnswers: (params: {
    answers: { header: string; label: string }[];
    questions: AskUserQuestionItem[];
  }) => void;
  stopChat: () => void;
} => {
  const [entriesBySessionInternal, setEntriesBySessionInternal] = useState<
    Map<SessionId, Map<ChatEntryUuid, ChatEntry>>
  >(new Map());
  const [slotEntriesInternal, setSlotEntriesInternal] = useState<
    Map<SlotIndex, Map<ChatEntryUuid, ChatEntry>>
  >(new Map());
  const [quest, setQuest] = useState<Quest | null>(null);
  const [pendingClarification, setPendingClarification] = useState<{
    questions: AskUserQuestionItem[];
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const entriesBySession = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: entriesBySessionInternal }),
    [entriesBySessionInternal],
  );
  const slotEntries = useMemo(
    () => deriveSortedChatEntriesMapTransformer({ source: slotEntriesInternal }),
    [slotEntriesInternal],
  );

  const questIdRef = useRef<QuestId | null>(questId);
  questIdRef.current = questId;

  // Track the questId that was active at subscribe time so cleanup sends the correct id
  const subscribedQuestIdRef = useRef<QuestId | null>(null);

  useEffect(() => {
    const opensSub = webSocketChannelState.opens$().subscribe((): void => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return;
      subscribedQuestIdRef.current = activeQuestId;
      webSocketChannelState.sendSubscribeQuest({ questId: activeQuestId });
    });

    const chatOutputSub = rxjsFilterAdapter({
      source: webSocketChannelState.chatOutput$(),
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

      const slotIndexParsed = slotIndexContract.safeParse(payload.slotIndex);
      if (slotIndexParsed.success) {
        const slotKey = slotIndexParsed.data;
        setSlotEntriesInternal((prev) =>
          upsertChatEntriesByUuidTransformer({ prev, key: slotKey, newEntries: validEntries }),
        );
      }

      setIsStreaming(true);
    });

    const chatStreamEndedSub = webSocketChannelState.chatStreamEnded$().subscribe((): void => {
      setIsStreaming(false);
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
    });

    return (): void => {
      opensSub.unsubscribe();
      chatOutputSub.unsubscribe();
      chatStreamEndedSub.unsubscribe();
      clarificationRequestSub.unsubscribe();
      questUpdatedSub.unsubscribe();

      const subscribedQuestId = subscribedQuestIdRef.current;
      if (subscribedQuestId) {
        webSocketChannelState.sendUnsubscribeQuest({ questId: subscribedQuestId });
        subscribedQuestIdRef.current = null;
      }
    };
  }, [questId]);

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
      setIsStreaming(true);
      setPendingClarification(null);

      const currentQuest = quest;
      const needsResume =
        currentQuest !== null && isUserPausedQuestStatusGuard({ status: currentQuest.status });

      const resumeStep = needsResume
        ? questResumeBroker({ questId: activeQuestId })
        : Promise.resolve();

      resumeStep
        .then(async () => questChatBroker({ questId: activeQuestId, message }))
        .catch((err: unknown) => {
          setIsStreaming(false);
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
      setIsStreaming(true);
      setPendingClarification(null);

      questClarifyBroker({
        questId: activeQuestId,
        answers,
        questions,
      }).catch((err: unknown) => {
        setIsStreaming(false);
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
      setIsStreaming(false);
    });
  }, []);

  return {
    entriesBySession,
    slotEntries,
    quest,
    pendingClarification,
    isStreaming,
    sendMessage,
    submitClarifyAnswers,
    stopChat,
  };
};
