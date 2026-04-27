/**
 * PURPOSE: React hook that owns the live quest workspace WebSocket lifecycle, accumulates per-workitem chat entries, and exposes message/clarify/stop actions keyed by questId
 *
 * USAGE:
 * const { entriesBySession, quest, pendingClarification, isStreaming, sendMessage, submitClarifyAnswers, stopChat } = useQuestChatBinding({ questId });
 * // Subscribes to ws://host/ws on mount, sends subscribe-quest, accumulates entries by sessionId, returns reactive state
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AskUserQuestionItem,
  ChatEntry,
  Quest,
  QuestId,
  SessionId,
  UserInput,
} from '@dungeonmaster/shared/contracts';
import {
  askUserQuestionContract,
  chatEntryContract,
  questContract,
  wsMessageContract,
} from '@dungeonmaster/shared/contracts';
import { isUserPausedQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { questChatBroker } from '../../brokers/quest/chat/quest-chat-broker';
import { questClarifyBroker } from '../../brokers/quest/clarify/quest-clarify-broker';
import { questPauseBroker } from '../../brokers/quest/pause/quest-pause-broker';
import { questResumeBroker } from '../../brokers/quest/resume/quest-resume-broker';
import { chatCompletePayloadContract } from '../../contracts/chat-complete-payload/chat-complete-payload-contract';
import { chatHistoryCompletePayloadContract } from '../../contracts/chat-history-complete-payload/chat-history-complete-payload-contract';
import { chatOutputPayloadContract } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import { clarificationRequestPayloadContract } from '../../contracts/clarification-request-payload/clarification-request-payload-contract';
import { questModifiedPayloadContract } from '../../contracts/quest-modified-payload/quest-modified-payload-contract';
import { slotIndexContract } from '../../contracts/slot-index/slot-index-contract';
import type { SlotIndex } from '../../contracts/slot-index/slot-index-contract';

const SYNTHETIC_SESSION_KEY = '__no_session__' as SessionId;

type WsConnection = ReturnType<typeof websocketConnectAdapter>;

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
  const [entriesBySession, setEntriesBySession] = useState<Map<SessionId, ChatEntry[]>>(new Map());
  const [slotEntries, setSlotEntries] = useState<Map<SlotIndex, ChatEntry[]>>(new Map());
  const [quest, setQuest] = useState<Quest | null>(null);
  const [pendingClarification, setPendingClarification] = useState<{
    questions: AskUserQuestionItem[];
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const questIdRef = useRef<QuestId | null>(questId);
  const wsRef = useRef<WsConnection | null>(null);
  const subscribedRef = useRef(false);
  questIdRef.current = questId;

  const handleWebSocketMessage = useCallback((message: unknown): void => {
    const parsed = wsMessageContract.safeParse(message);
    if (!parsed.success) return;

    const activeQuestId = questIdRef.current;
    if (!activeQuestId) return;

    if (parsed.data.type === 'chat-output') {
      const payloadResult = chatOutputPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.questId !== activeQuestId) return;

      const rawEntries = payloadResult.data.entries;
      if (!Array.isArray(rawEntries)) return;

      const validEntries: ChatEntry[] = [];
      for (const candidate of rawEntries) {
        const parseResult = chatEntryContract.safeParse(candidate);
        if (parseResult.success) {
          validEntries.push(parseResult.data);
        }
      }

      if (validEntries.length === 0) return;

      const sessionKey = payloadResult.data.sessionId ?? SYNTHETIC_SESSION_KEY;
      setEntriesBySession((prev) => {
        const next = new Map(prev);
        const existing = next.get(sessionKey) ?? [];
        next.set(sessionKey, [...existing, ...validEntries]);
        return next;
      });

      // Slot routing — when payload carries a slotIndex (live active-slot output
      // from the orchestrator's slot manager), accumulate per-slot so the
      // ExecutionPanelWidget's active row can render streaming text in place.
      const slotIndexParsed = slotIndexContract.safeParse(payloadResult.data.slotIndex);
      if (slotIndexParsed.success) {
        const slotKey = slotIndexParsed.data;
        setSlotEntries((prev) => {
          const next = new Map(prev);
          const existing = next.get(slotKey) ?? [];
          next.set(slotKey, [...existing, ...validEntries]);
          return next;
        });
      }

      setIsStreaming(true);
      return;
    }

    if (parsed.data.type === 'chat-complete') {
      const payloadResult = chatCompletePayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      setIsStreaming(false);
      return;
    }

    if (parsed.data.type === 'chat-history-complete') {
      const payloadResult = chatHistoryCompletePayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      setIsStreaming(false);
      return;
    }

    if (parsed.data.type === 'clarification-request') {
      const payloadResult = clarificationRequestPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      const result = askUserQuestionContract.safeParse({
        questions: payloadResult.data.questions,
      });
      if (!result.success) return;
      setPendingClarification({ questions: result.data.questions });
      return;
    }

    if (parsed.data.type === 'quest-modified') {
      const payloadResult = questModifiedPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.questId !== activeQuestId) return;
      const questParsed = questContract.safeParse(payloadResult.data.quest);
      if (!questParsed.success) return;
      setQuest(questParsed.data);
    }
  }, []);

  useEffect(() => {
    wsRef.current = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: handleWebSocketMessage,
      onOpen: (): void => {
        const activeQuestId = questIdRef.current;
        if (!activeQuestId) return;
        if (subscribedRef.current) return;
        const ws = wsRef.current;
        if (!ws) return;
        const sent = ws.send({ type: 'subscribe-quest', questId: activeQuestId });
        if (sent) {
          subscribedRef.current = true;
        }
      },
    });

    return (): void => {
      const activeQuestId = questIdRef.current;
      const ws = wsRef.current;
      if (ws && activeQuestId && subscribedRef.current) {
        ws.send({ type: 'unsubscribe-quest', questId: activeQuestId });
      }
      subscribedRef.current = false;
      if (ws) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [handleWebSocketMessage]);

  useEffect(() => {
    if (!questId) return;
    if (subscribedRef.current) return;
    const ws = wsRef.current;
    if (!ws) return;
    const sent = ws.send({ type: 'subscribe-quest', questId });
    if (sent) {
      subscribedRef.current = true;
    }
  }, [questId]);

  const sendMessage = useCallback(
    ({ message }: { message: UserInput }): void => {
      const activeQuestId = questIdRef.current;
      if (!activeQuestId) return;

      const userEntry = chatEntryContract.parse({ role: 'user', content: message });
      setEntriesBySession((prev) => {
        const next = new Map(prev);
        const existing = next.get(SYNTHETIC_SESSION_KEY) ?? [];
        next.set(SYNTHETIC_SESSION_KEY, [...existing, userEntry]);
        return next;
      });
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
          });
          setEntriesBySession((prev) => {
            const next = new Map(prev);
            const existing = next.get(SYNTHETIC_SESSION_KEY) ?? [];
            next.set(SYNTHETIC_SESSION_KEY, [...existing, errorEntry]);
            return next;
          });
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
      const userEntry = chatEntryContract.parse({ role: 'user', content: userMessage });
      setEntriesBySession((prev) => {
        const next = new Map(prev);
        const existing = next.get(SYNTHETIC_SESSION_KEY) ?? [];
        next.set(SYNTHETIC_SESSION_KEY, [...existing, userEntry]);
        return next;
      });
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
        });
        setEntriesBySession((prev) => {
          const next = new Map(prev);
          const existing = next.get(SYNTHETIC_SESSION_KEY) ?? [];
          next.set(SYNTHETIC_SESSION_KEY, [...existing, errorEntry]);
          return next;
        });
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
