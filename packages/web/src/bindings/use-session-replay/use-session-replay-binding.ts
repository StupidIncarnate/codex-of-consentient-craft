/**
 * PURPOSE: React hook that owns the readonly session viewer WebSocket lifecycle, sends replay-history on connect, and accumulates entries until chat-history-complete fires
 *
 * USAGE:
 * const { entries, isLoading, sessionNotFound } = useSessionReplayBinding({ sessionId, guildId });
 * // Subscribes to ws://host/ws on mount, sends replay-history { sessionId, guildId, chatProcessId: 'replay-<sessionId>' }, returns reactive state
 *
 * Entries arrive from the orchestrator's replay broker already timestamp-sorted, but we still
 * dedup by uuid (defensive — same convergence machinery as the live binding) and re-sort on
 * read. This guarantees streaming-vs-replay parity even if the wire ever delivers entries in a
 * different order.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ChatEntry,
  ChatEntryUuid,
  GuildId,
  ProcessId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { chatEntryContract, wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';
import { chatHistoryCompletePayloadContract } from '../../contracts/chat-history-complete-payload/chat-history-complete-payload-contract';
import { chatOutputPayloadContract } from '../../contracts/chat-output-payload/chat-output-payload-contract';
import { sortChatEntriesByTimestampTransformer } from '../../transformers/sort-chat-entries-by-timestamp/sort-chat-entries-by-timestamp-transformer';

type WsConnection = ReturnType<typeof websocketConnectAdapter>;

export const useSessionReplayBinding = ({
  sessionId,
  guildId,
}: {
  sessionId: SessionId | null;
  guildId: GuildId | null;
}): {
  entries: ChatEntry[];
  isLoading: boolean;
  sessionNotFound: boolean;
} => {
  const [entriesByUuid, setEntriesByUuid] = useState<Map<ChatEntryUuid, ChatEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const entries = useMemo(
    () => sortChatEntriesByTimestampTransformer({ entries: [...entriesByUuid.values()] }),
    [entriesByUuid],
  );

  const sessionIdRef = useRef<SessionId | null>(sessionId);
  const guildIdRef = useRef<GuildId | null>(guildId);
  const wsRef = useRef<WsConnection | null>(null);
  const requestSentRef = useRef(false);
  const replayProcessIdRef = useRef<ProcessId | null>(null);
  const receivedEntriesRef = useRef(false);
  sessionIdRef.current = sessionId;
  guildIdRef.current = guildId;

  const handleWebSocketMessage = useCallback((message: unknown): void => {
    const parsed = wsMessageContract.safeParse(message);
    if (!parsed.success) return;

    const activeProcessId = replayProcessIdRef.current;
    if (!activeProcessId) return;

    if (parsed.data.type === 'chat-output') {
      const payloadResult = chatOutputPayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== activeProcessId) return;

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
      receivedEntriesRef.current = true;
      setEntriesByUuid((prev) => {
        const next = new Map(prev);
        for (const entry of validEntries) {
          next.set(entry.uuid, entry);
        }
        return next;
      });
      return;
    }

    if (parsed.data.type === 'chat-history-complete') {
      const payloadResult = chatHistoryCompletePayloadContract.safeParse(parsed.data.payload);
      if (!payloadResult.success) return;
      if (payloadResult.data.chatProcessId !== activeProcessId) return;

      setIsLoading(false);
      if (!receivedEntriesRef.current) {
        setSessionNotFound(true);
      }
    }
  }, []);

  const sendReplayRequest = useCallback(
    ({
      ws,
      activeSessionId,
      activeGuildId,
    }: {
      ws: WsConnection;
      activeSessionId: SessionId;
      activeGuildId: GuildId;
    }): void => {
      const replayProcessId = `replay-${activeSessionId}` as ProcessId;
      replayProcessIdRef.current = replayProcessId;
      const sent = ws.send({
        type: 'replay-history',
        sessionId: activeSessionId,
        guildId: activeGuildId,
        chatProcessId: replayProcessId,
      });
      if (sent) {
        requestSentRef.current = true;
      }
    },
    [],
  );

  useEffect(() => {
    wsRef.current = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: handleWebSocketMessage,
      onOpen: (): void => {
        const activeSessionId = sessionIdRef.current;
        const activeGuildId = guildIdRef.current;
        if (!activeSessionId || !activeGuildId) return;
        if (requestSentRef.current) return;
        const ws = wsRef.current;
        if (!ws) return;
        sendReplayRequest({
          ws,
          activeSessionId,
          activeGuildId,
        });
      },
    });

    return (): void => {
      requestSentRef.current = false;
      replayProcessIdRef.current = null;
      receivedEntriesRef.current = false;
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        ws.close();
      }
    };
  }, [handleWebSocketMessage, sendReplayRequest]);

  useEffect(() => {
    if (!sessionId || !guildId) return;
    if (requestSentRef.current) return;
    const ws = wsRef.current;
    if (!ws) return;
    sendReplayRequest({ ws, activeSessionId: sessionId, activeGuildId: guildId });
  }, [sessionId, guildId, sendReplayRequest]);

  return { entries, isLoading, sessionNotFound };
};
