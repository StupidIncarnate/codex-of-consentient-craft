/**
 * PURPOSE: React hook that manages session-centric chat state and WebSocket communication for real-time agent responses
 *
 * USAGE:
 * const {entries, isStreaming, currentSessionId, sendMessage, stopChat} = useSessionChatBinding({guildId, sessionId});
 * // Returns chat entries, streaming state, send/stop functions
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  GuildId,
  ProcessId,
  QuestId,
  QuestStatus,
  SessionId,
  UserInput,
} from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { sessionChatBroker } from '../../brokers/session/chat/session-chat-broker';
import { sessionChatStopBroker } from '../../brokers/session/chat-stop/session-chat-stop-broker';
import { sessionClarifyBroker } from '../../brokers/session/clarify/session-clarify-broker';
import type { AskUserQuestionItem } from '@dungeonmaster/shared/contracts';
import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import { chatCompletePayloadContract } from '../../contracts/chat-complete-payload/chat-complete-payload-contract';
import { chatHistoryCompletePayloadContract } from '../../contracts/chat-history-complete-payload/chat-history-complete-payload-contract';
import { chatOutputPayloadContract } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import { chatPatchPayloadContract } from '../../contracts/chat-patch-payload/chat-patch-payload-contract';
import { chatSessionStartedPayloadContract } from '../../contracts/chat-session-started-payload/chat-session-started-payload-contract';
import { clarificationRequestPayloadContract } from '../../contracts/clarification-request-payload/clarification-request-payload-contract';

export const useSessionChatBinding = ({
  guildId,
  sessionId: initialSessionId,
}: {
  guildId: GuildId | null;
  sessionId?: SessionId | null;
}): {
  setQuestContext: (params: { questId?: QuestId; questStatus?: QuestStatus }) => void;
  entries: ChatEntry[];
  isStreaming: boolean;
  currentSessionId: SessionId | null;
  chatProcessId: ProcessId | null;
  pendingClarification: { questions: AskUserQuestionItem[] } | null;
  sessionNotFound: boolean;
  sendMessage: (params: { message: UserInput }) => void;
  submitClarifyAnswers: (params: {
    questId: QuestId;
    answers: { header: string; label: string }[];
    questions: AskUserQuestionItem[];
  }) => void;
  stopChat: () => void;
} => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<SessionId | null>(
    initialSessionId ?? null,
  );
  const [pendingClarification, setPendingClarification] = useState<{
    questions: AskUserQuestionItem[];
  } | null>(null);
  const sessionIdRef = useRef<SessionId | null>(initialSessionId ?? null);
  const chatProcessIdRef = useRef<ProcessId | null>(null);
  const wsRef = useRef<{ close: () => void; send: (data: Record<string, unknown>) => void } | null>(
    null,
  );
  const historyLoadedRef = useRef(false);
  const replayReceivedEntriesRef = useRef(false);
  const wsOpenRef = useRef(false);
  const guildIdRef = useRef(guildId);
  const initialSessionIdRef = useRef(initialSessionId);
  const pendingChatProcessIdRef = useRef(false);
  const wsBufferRef = useRef<unknown[]>([]);
  const questIdRef = useRef<QuestId | undefined>(undefined);
  const questStatusRef = useRef<QuestStatus | undefined>(undefined);
  guildIdRef.current = guildId;
  initialSessionIdRef.current = initialSessionId;

  const processWebSocketMessage = useCallback((message: unknown): void => {
    const parsed = wsMessageContract.safeParse(message);
    if (!parsed.success) return;

    if (parsed.data.type === 'chat-output') {
      const payloadResult = chatOutputPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== chatProcessIdRef.current) return;

      const rawEntries = payloadResult.data.entries;
      if (!Array.isArray(rawEntries)) return;

      const validEntries: ChatEntry[] = [];
      for (const candidate of rawEntries) {
        const parseResult = chatEntryContract.safeParse(candidate);
        if (parseResult.success) {
          validEntries.push(parseResult.data);
        }
      }

      if (validEntries.length > 0) {
        replayReceivedEntriesRef.current = true;
        setEntries((prev) => [...prev, ...validEntries]);
      }
    }

    if (parsed.data.type === 'clarification-request') {
      const payloadResult = clarificationRequestPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== chatProcessIdRef.current) return;

      const result = askUserQuestionContract.safeParse({ questions: payloadResult.data.questions });

      if (result.success) {
        setPendingClarification({ questions: result.data.questions });
      }
    }

    if (parsed.data.type === 'chat-session-started') {
      const payloadResult = chatSessionStartedPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== chatProcessIdRef.current) return;

      sessionIdRef.current = payloadResult.data.sessionId;
      setCurrentSessionId(payloadResult.data.sessionId);
    }

    if (parsed.data.type === 'chat-complete') {
      const payloadResult = chatCompletePayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== chatProcessIdRef.current) return;

      const completedSessionId = payloadResult.data.sessionId;
      if (completedSessionId !== undefined) {
        sessionIdRef.current = completedSessionId;
        setCurrentSessionId(completedSessionId);
      }

      setIsStreaming(false);
    }

    if (parsed.data.type === 'chat-history-complete') {
      const payloadResult = chatHistoryCompletePayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== chatProcessIdRef.current) return;

      if (!replayReceivedEntriesRef.current && initialSessionIdRef.current) {
        setSessionNotFound(true);
      }

      chatProcessIdRef.current = null;
    }

    if (parsed.data.type === 'chat-patch') {
      const payloadResult = chatPatchPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;

      const { toolUseId, agentId } = payloadResult.data;

      setEntries((prev) =>
        prev.map((entry) => {
          if ('toolUseId' in entry && entry.toolUseId === toolUseId) {
            return chatEntryContract.parse({ ...entry, agentId });
          }

          return entry;
        }),
      );
    }
  }, []);

  const handleWebSocketMessage = useCallback(
    (message: unknown): void => {
      if (pendingChatProcessIdRef.current && chatProcessIdRef.current === null) {
        wsBufferRef.current.push(message);
        return;
      }

      processWebSocketMessage(message);
    },
    [processWebSocketMessage],
  );

  useEffect(() => {
    wsRef.current = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: handleWebSocketMessage,
      onOpen: (): void => {
        wsOpenRef.current = true;

        if (historyLoadedRef.current) return;

        const targetGuildId = guildIdRef.current;
        const targetSessionId = initialSessionIdRef.current;
        if (!targetGuildId || !targetSessionId || !wsRef.current) return;

        historyLoadedRef.current = true;
        sessionIdRef.current = targetSessionId;
        setCurrentSessionId(targetSessionId);

        const replayProcessId = `replay-${targetSessionId}` as ProcessId;
        chatProcessIdRef.current = replayProcessId;

        wsRef.current.send({
          type: 'replay-history',
          sessionId: targetSessionId,
          guildId: targetGuildId,
          chatProcessId: replayProcessId,
        });
      },
    });

    return (): void => {
      wsOpenRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [handleWebSocketMessage]);

  useEffect(() => {
    if (historyLoadedRef.current) return;
    if (!wsOpenRef.current) return;
    if (!wsRef.current) return;
    if (!guildId) return;
    if (!initialSessionId) return;

    historyLoadedRef.current = true;
    sessionIdRef.current = initialSessionId;
    setCurrentSessionId(initialSessionId);

    const replayProcessId = `replay-${initialSessionId}` as ProcessId;
    chatProcessIdRef.current = replayProcessId;

    wsRef.current.send({
      type: 'replay-history',
      sessionId: initialSessionId,
      guildId,
      chatProcessId: replayProcessId,
    });
  }, [guildId, initialSessionId]);

  const sendMessage = useCallback(
    ({ message }: { message: UserInput }): void => {
      if (!guildId) return;

      historyLoadedRef.current = true;

      const userEntry = chatEntryContract.parse({ role: 'user', content: message });
      setEntries((prev) => [...prev, userEntry]);
      setIsStreaming(true);
      setPendingClarification(null);

      const activeSessionId = sessionIdRef.current;

      chatProcessIdRef.current = null;
      pendingChatProcessIdRef.current = true;
      wsBufferRef.current = [];

      const activeQuestId = questIdRef.current;
      const activeQuestStatus = questStatusRef.current;

      sessionChatBroker({
        guildId,
        message,
        ...(activeSessionId ? { sessionId: activeSessionId } : {}),
        ...(activeQuestId ? { questId: activeQuestId } : {}),
        ...(activeQuestStatus ? { questStatus: activeQuestStatus } : {}),
      })
        .then(({ chatProcessId }) => {
          chatProcessIdRef.current = chatProcessId;
          pendingChatProcessIdRef.current = false;

          const buffered = wsBufferRef.current;
          wsBufferRef.current = [];
          for (const bufferedMessage of buffered) {
            processWebSocketMessage(bufferedMessage);
          }
        })
        .catch((err: unknown) => {
          pendingChatProcessIdRef.current = false;
          wsBufferRef.current = [];
          setIsStreaming(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
          });
          setEntries((prev) => [...prev, errorEntry]);
        });
    },
    [guildId, processWebSocketMessage],
  );

  const submitClarifyAnswers = useCallback(
    ({
      questId,
      answers,
      questions,
    }: {
      questId: QuestId;
      answers: { header: string; label: string }[];
      questions: AskUserQuestionItem[];
    }): void => {
      if (!guildId) return;

      const activeSessionId = sessionIdRef.current;
      if (!activeSessionId) return;

      historyLoadedRef.current = true;

      const userMessage = answers.map((a) => `${a.header}: ${a.label}`).join('\n');
      const userEntry = chatEntryContract.parse({ role: 'user', content: userMessage });
      setEntries((prev) => [...prev, userEntry]);
      setIsStreaming(true);
      setPendingClarification(null);

      chatProcessIdRef.current = null;
      pendingChatProcessIdRef.current = true;
      wsBufferRef.current = [];

      sessionClarifyBroker({
        sessionId: activeSessionId,
        guildId,
        questId,
        answers,
        questions,
      })
        .then(({ chatProcessId }) => {
          chatProcessIdRef.current = chatProcessId;
          pendingChatProcessIdRef.current = false;

          const buffered = wsBufferRef.current;
          wsBufferRef.current = [];
          for (const bufferedMessage of buffered) {
            processWebSocketMessage(bufferedMessage);
          }
        })
        .catch((err: unknown) => {
          pendingChatProcessIdRef.current = false;
          wsBufferRef.current = [];
          setIsStreaming(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'system',
            type: 'error',
            content: errorMessage,
          });
          setEntries((prev) => [...prev, errorEntry]);
        });
    },
    [guildId, processWebSocketMessage],
  );

  const stopChat = useCallback((): void => {
    const currentProcessId = chatProcessIdRef.current;
    if (!currentProcessId) return;

    const activeSessionId = sessionIdRef.current;
    sessionChatStopBroker({
      chatProcessId: currentProcessId,
      ...(activeSessionId ? { sessionId: activeSessionId } : {}),
    }).catch(() => {
      setIsStreaming(false);
    });
  }, []);

  const setQuestContext = useCallback(
    ({
      questId: nextQuestId,
      questStatus: nextQuestStatus,
    }: {
      questId?: QuestId;
      questStatus?: QuestStatus;
    }): void => {
      questIdRef.current = nextQuestId;
      questStatusRef.current = nextQuestStatus;
    },
    [],
  );

  return {
    setQuestContext,
    entries,
    isStreaming,
    currentSessionId,
    chatProcessId: chatProcessIdRef.current,
    pendingClarification,
    sessionNotFound,
    sendMessage,
    submitClarifyAnswers,
    stopChat,
  };
};
