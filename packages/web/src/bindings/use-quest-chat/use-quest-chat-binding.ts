/**
 * PURPOSE: React hook that manages quest chat state and WebSocket communication for real-time agent responses
 *
 * USAGE:
 * const {entries, isStreaming, sendMessage} = useQuestChatBinding({questId});
 * // Returns chat entries, streaming state, and a function to send messages
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProcessId, QuestId, SessionId, UserInput } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { questChatBroker } from '../../brokers/quest/chat/quest-chat-broker';
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { chatEntryContract } from '../../contracts/chat-entry/chat-entry-contract';
import { streamingBlockCountContract } from '../../contracts/streaming-block-count/streaming-block-count-contract';
import type { StreamingBlockCount } from '../../contracts/streaming-block-count/streaming-block-count-contract';
import { streamJsonToChatEntryTransformer } from '../../transformers/stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';

export const useQuestChatBinding = ({
  questId,
}: {
  questId: QuestId;
}): {
  entries: ChatEntry[];
  isStreaming: boolean;
  sendMessage: (params: { message: UserInput }) => void;
} => {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionIdRef = useRef<SessionId | null>(null);
  const chatProcessIdRef = useRef<ProcessId | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const streamingBlockCountRef = useRef<StreamingBlockCount>(streamingBlockCountContract.parse(0));

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
      }

      if (result.entries.length > 0) {
        const previousBlockCount = streamingBlockCountRef.current;

        streamingBlockCountRef.current = streamingBlockCountContract.parse(result.entries.length);
        setEntries((prev) => {
          const baseCount = prev.length - previousBlockCount;
          const base = prev.slice(0, baseCount);

          return [...base, ...result.entries];
        });
      }
    }

    if (parsed.data.type === 'chat-complete') {
      const { payload } = parsed.data;
      const rawChatProcessId: unknown = Reflect.get(payload, 'chatProcessId');

      if (rawChatProcessId !== chatProcessIdRef.current) return;

      const rawSessionId: unknown = Reflect.get(payload, 'sessionId');
      if (typeof rawSessionId === 'string' && rawSessionId.length > 0) {
        sessionIdRef.current = rawSessionId as SessionId;
      }

      streamingBlockCountRef.current = streamingBlockCountContract.parse(0);
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

  const sendMessage = useCallback(
    ({ message }: { message: UserInput }): void => {
      const userEntry = chatEntryContract.parse({ role: 'user', content: message });
      setEntries((prev) => [...prev, userEntry]);
      setIsStreaming(true);
      streamingBlockCountRef.current = streamingBlockCountContract.parse(0);

      const currentSessionId = sessionIdRef.current;

      questChatBroker({
        questId,
        message,
        ...(currentSessionId ? { sessionId: currentSessionId } : {}),
      })
        .then(({ chatProcessId }) => {
          chatProcessIdRef.current = chatProcessId;
        })
        .catch((err: unknown) => {
          setIsStreaming(false);
          const errorMessage = err instanceof Error ? err.message : String(err);
          const errorEntry = chatEntryContract.parse({
            role: 'assistant',
            type: 'text',
            content: `Error: ${errorMessage}`,
          });
          setEntries((prev) => [...prev, errorEntry]);
        });
    },
    [questId],
  );

  return { entries, isStreaming, sendMessage };
};
