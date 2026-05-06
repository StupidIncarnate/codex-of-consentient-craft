/**
 * PURPOSE: React hook that subscribes to the shared WebSocket channel for session replay. Sends replay-history on every channel open (including reconnects) and accumulates entries until chat-history-complete or chat-complete fires.
 *
 * USAGE:
 * const { entries, isLoading, sessionNotFound } = useSessionReplayBinding({ sessionId, guildId });
 * // Subscribes to typed observables on webSocketChannelState, sends replay-history { sessionId, guildId, chatProcessId: 'replay-<sessionId>' } on each open, returns reactive state
 *
 * Entries arrive from the orchestrator's replay broker already timestamp-sorted, but we still
 * dedup by uuid (defensive — same convergence machinery as the live binding) and re-sort on
 * read. This guarantees streaming-vs-replay parity even if the wire ever delivers entries in a
 * different order.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  ChatEntry,
  ChatEntryUuid,
  GuildId,
  ProcessId,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import { chatEntryContract } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapter } from '../../adapters/rxjs/filter/rxjs-filter-adapter';
import { sortChatEntriesByTimestampTransformer } from '../../transformers/sort-chat-entries-by-timestamp/sort-chat-entries-by-timestamp-transformer';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';

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

  const replayProcessId = useMemo<ProcessId | null>(
    () => (sessionId ? (`replay-${sessionId}` as ProcessId) : null),
    [sessionId],
  );

  const sessionIdRef = useRef<SessionId | null>(sessionId);
  const guildIdRef = useRef<GuildId | null>(guildId);
  const replayProcessIdRef = useRef<ProcessId | null>(replayProcessId);
  const receivedEntriesRef = useRef(false);
  sessionIdRef.current = sessionId;
  guildIdRef.current = guildId;
  replayProcessIdRef.current = replayProcessId;

  useEffect(() => {
    const opensSub = webSocketChannelState.opens$().subscribe((): void => {
      const activeSessionId = sessionIdRef.current;
      const activeGuildId = guildIdRef.current;
      if (!activeSessionId || !activeGuildId) return;
      const activeChatProcessId = replayProcessIdRef.current;
      if (!activeChatProcessId) return;
      webSocketChannelState.sendReplayHistory({
        sessionId: activeSessionId,
        guildId: activeGuildId,
        chatProcessId: activeChatProcessId,
      });
    });

    const chatOutputSub = rxjsFilterAdapter({
      source: webSocketChannelState.chatOutput$(),
      predicate: (p) => p.chatProcessId === replayProcessIdRef.current,
    }).subscribe((payload): void => {
      const rawEntries = payload.entries;
      if (!Array.isArray(rawEntries)) return;

      const validEntries: ChatEntry[] = [];
      for (const candidate of rawEntries as unknown[]) {
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
    });

    const streamEndedSub = rxjsFilterAdapter({
      source: webSocketChannelState.chatStreamEnded$(),
      predicate: (p) => p.chatProcessId === replayProcessIdRef.current,
    }).subscribe((): void => {
      setIsLoading(false);
      if (!receivedEntriesRef.current) {
        setSessionNotFound(true);
      }
    });

    return (): void => {
      opensSub.unsubscribe();
      chatOutputSub.unsubscribe();
      streamEndedSub.unsubscribe();
    };
  }, []);

  return { entries, isLoading, sessionNotFound };
};
