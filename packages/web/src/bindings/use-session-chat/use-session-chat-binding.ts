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
import { sessionChatHistoryBroker } from '../../brokers/session/chat-history/session-chat-history-broker';
import { sessionChatStopBroker } from '../../brokers/session/chat-stop/session-chat-stop-broker';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import { jsonlToChatEntriesTransformer } from '../../transformers/jsonl-to-chat-entries/jsonl-to-chat-entries-transformer';
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
  sendMessage: (params: { message: UserInput }) => void;
  stopChat: () => void;
} => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<SessionId | null>(
    initialSessionId ?? null,
  );
  const sessionIdRef = useRef<SessionId | null>(initialSessionId ?? null);
  const chatProcessIdRef = useRef<ProcessId | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);
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
  }, []);

  useEffect(() => {
    wsRef.current = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: handleWebSocketMessage,
    });

    return (): void => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [handleWebSocketMessage]);

  useEffect(() => {
    if (historyLoadedRef.current) return;
    if (!guildId) return;

    const targetSessionId = initialSessionId;
    if (!targetSessionId) return;

    historyLoadedRef.current = true;
    sessionIdRef.current = targetSessionId;
    setCurrentSessionId(targetSessionId);

    sessionChatHistoryBroker({ sessionId: targetSessionId, guildId })
      .then((rawEntries) => {
        if (rawEntries.length > 0) {
          const chatEntries = jsonlToChatEntriesTransformer({ entries: rawEntries });
          setEntries(chatEntries);
        }
      })
      .catch(() => undefined);
  }, [guildId, initialSessionId]);

  const sendMessage = useCallback(
    ({ message }: { message: UserInput }): void => {
      if (!guildId) return;

      const userEntry = chatEntryContract.parse({ role: 'user', content: message });
      setEntries((prev) => [...prev, userEntry]);
      setIsStreaming(true);

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

  return { entries, isStreaming, currentSessionId, sendMessage, stopChat };
};
