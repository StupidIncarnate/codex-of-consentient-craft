/**
 * PURPOSE: React hook that manages session-centric chat state and WebSocket communication for real-time agent responses
 *
 * USAGE:
 * const {entries, isStreaming, currentSessionId, sendMessage, stopChat} = useSessionChatBinding({guildId, sessionId});
 * // Returns chat entries, streaming state, send/stop functions
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { GuildId, ProcessId, SessionId, UserInput } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { sessionChatBroker } from '../../brokers/session/chat/session-chat-broker';
import { sessionChatStopBroker } from '../../brokers/session/chat-stop/session-chat-stop-broker';
import type { AskUserQuestionItem } from '../../contracts/ask-user-question/ask-user-question-contract';
import { askUserQuestionContract } from '../../contracts/ask-user-question/ask-user-question-contract';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import { streamJsonToChatEntryTransformer } from '../../transformers/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';

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
  pendingClarification: { questions: AskUserQuestionItem[] } | null;
  sendMessage: (params: { message: UserInput }) => void;
  stopChat: () => void;
} => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
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

  const handleWebSocketMessage = useCallback((message: unknown): void => {
    const parsed = wsMessageContract.safeParse(message);
    if (!parsed.success) return;

    if (parsed.data.type === 'chat-output') {
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      const rawLine: unknown = Reflect.get(payload, 'line');
      if (typeof rawLine !== 'string') return;

      const result = streamJsonToChatEntryTransformer({ line: rawLine });

      if (result.sessionId) {
        sessionIdRef.current = result.sessionId;
        setCurrentSessionId(result.sessionId);
      }

      if (result.entries.length > 0) {
        setEntries((prev) => [...prev, ...result.entries]);
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

  const wsOpenRef = useRef(false);
  const guildIdRef = useRef(guildId);
  const initialSessionIdRef = useRef(initialSessionId);
  guildIdRef.current = guildId;
  initialSessionIdRef.current = initialSessionId;

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

      sessionChatBroker({
        guildId,
        message,
        ...(activeSessionId ? { sessionId: activeSessionId } : {}),
      })
        .then(({ chatProcessId }) => {
          chatProcessIdRef.current = chatProcessId;
        })
        .catch((err: unknown) => {
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
    [guildId],
  );

  const stopChat = useCallback((): void => {
    const currentProcessId = chatProcessIdRef.current;
    const activeSessionId = sessionIdRef.current;
    if (!currentProcessId || !activeSessionId) return;

    sessionChatStopBroker({ sessionId: activeSessionId, chatProcessId: currentProcessId }).catch(
      () => {
        setIsStreaming(false);
      },
    );
  }, []);

  return { entries, isStreaming, currentSessionId, pendingClarification, sendMessage, stopChat };
};
