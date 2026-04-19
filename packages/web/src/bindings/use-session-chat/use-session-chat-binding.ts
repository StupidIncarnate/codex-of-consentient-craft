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

export const useSessionChatBinding = ({
  guildId,
  sessionId: initialSessionId,
}: {
  guildId: GuildId | null;
  sessionId?: SessionId | null;
}): {
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
  guildIdRef.current = guildId;
  initialSessionIdRef.current = initialSessionId;

  const processWebSocketMessage = useCallback((message: unknown): void => {
    const parsed = wsMessageContract.safeParse(message);
    if (!parsed.success) return;

    if (parsed.data.type === 'chat-output') {
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      const rawEntries: unknown = Reflect.get(payload, 'entries');
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
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      const rawQuestions: unknown = Reflect.get(payload, 'questions');
      const result = askUserQuestionContract.safeParse({ questions: rawQuestions });

      if (result.success) {
        setPendingClarification({ questions: result.data.questions });
      }
    }

    if (parsed.data.type === 'chat-session-started') {
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      const rawSessionId: unknown = Reflect.get(payload, 'sessionId');
      if (typeof rawSessionId === 'string' && rawSessionId.length > 0) {
        sessionIdRef.current = rawSessionId as SessionId;
        setCurrentSessionId(rawSessionId as SessionId);
      }
    }

    if (parsed.data.type === 'chat-complete') {
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      const rawSessionId: unknown = Reflect.get(payload, 'sessionId');
      if (typeof rawSessionId === 'string' && rawSessionId.length > 0) {
        sessionIdRef.current = rawSessionId as SessionId;
        setCurrentSessionId(rawSessionId as SessionId);
      }

      setIsStreaming(false);
    }

    if (parsed.data.type === 'chat-history-complete') {
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      if (!replayReceivedEntriesRef.current && initialSessionIdRef.current) {
        setSessionNotFound(true);
      }

      chatProcessIdRef.current = null;
    }

    if (parsed.data.type === 'chat-patch') {
      const { payload } = parsed.data;
      const rawToolUseId: unknown = Reflect.get(payload, 'toolUseId');
      const rawAgentId: unknown = Reflect.get(payload, 'agentId');

      if (typeof rawToolUseId !== 'string' || rawToolUseId.length === 0) return;
      if (typeof rawAgentId !== 'string' || rawAgentId.length === 0) return;

      setEntries((prev) =>
        prev.map((entry) => {
          if ('toolUseId' in entry && entry.toolUseId === rawToolUseId) {
            return chatEntryContract.parse({ ...entry, agentId: rawAgentId });
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

      sessionChatBroker({
        guildId,
        message,
        ...(activeSessionId ? { sessionId: activeSessionId } : {}),
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

  return {
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
