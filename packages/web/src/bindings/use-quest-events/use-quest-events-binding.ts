/**
 * PURPOSE: React hook that owns quest state from WebSocket events, subscribing to quest-modified messages by session
 *
 * USAGE:
 * const {questData} = useQuestEventsBinding({sessionId, guildId});
 * // Returns {questData: Quest | null} updated in real-time via WS
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { GuildId, Quest, QuestId, SessionId } from '@dungeonmaster/shared/contracts';
import { questContract, wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';

type WsConnection = ReturnType<typeof websocketConnectAdapter>;

export const useQuestEventsBinding = ({
  sessionId,
  guildId,
}: {
  sessionId: SessionId | null;
  guildId: GuildId | null;
}): {
  questData: Quest | null;
  sessionHasNoQuest: boolean;
  requestRefresh: () => void;
} => {
  const [questData, setQuestData] = useState<Quest | null>(null);
  const [sessionHasNoQuest, setSessionHasNoQuest] = useState(false);
  const sessionIdRef = useRef<SessionId | null>(sessionId);
  const guildIdRef = useRef<GuildId | null>(guildId);
  const connectionRef = useRef<WsConnection | null>(null);
  const hasSentRequestRef = useRef(false);
  const questIdRef = useRef<QuestId | null>(null);

  sessionIdRef.current = sessionId;
  guildIdRef.current = guildId;

  useEffect(() => {
    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onOpen: (): void => {
        if (sessionIdRef.current && guildIdRef.current && !hasSentRequestRef.current) {
          const sent = connectionRef.current?.send({
            type: 'quest-by-session-request',
            sessionId: sessionIdRef.current,
            guildId: guildIdRef.current,
          });
          if (sent) {
            hasSentRequestRef.current = true;
          }
        }
      },
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;

        if (parsed.data.type === 'quest-by-session-not-found') {
          const payloadSessionId: unknown = Reflect.get(parsed.data.payload, 'sessionId');
          if (payloadSessionId === sessionIdRef.current) {
            setSessionHasNoQuest(true);
          }
          return;
        }

        if (parsed.data.type === 'quest-modified') {
          const rawQuest: unknown = Reflect.get(parsed.data.payload, 'quest');
          const questParsed = questContract.safeParse(rawQuest);
          if (!questParsed.success) return;

          const hasMatchingWorkItem = questParsed.data.workItems.some(
            (wi) => wi.sessionId === sessionIdRef.current,
          );
          if (sessionIdRef.current && !hasMatchingWorkItem) {
            return;
          }

          const payloadQuestId: unknown = Reflect.get(parsed.data.payload, 'questId');

          if (questIdRef.current === null) {
            if (typeof payloadQuestId === 'string') {
              questIdRef.current = payloadQuestId as QuestId;
            }
          }

          if (questIdRef.current !== null && payloadQuestId !== questIdRef.current) {
            return;
          }

          setQuestData(questParsed.data);
        }
      },
    });

    connectionRef.current = connection;

    if (sessionIdRef.current && guildIdRef.current && !hasSentRequestRef.current) {
      const sent = connection.send({
        type: 'quest-by-session-request',
        sessionId: sessionIdRef.current,
        guildId: guildIdRef.current,
      });
      if (sent) {
        hasSentRequestRef.current = true;
      }
    }

    return (): void => {
      connectionRef.current = null;
      hasSentRequestRef.current = false;
      questIdRef.current = null;
      connection.close();
    };
  }, []);

  useEffect(() => {
    if (sessionId && guildId && !hasSentRequestRef.current) {
      const sent = connectionRef.current?.send({
        type: 'quest-by-session-request',
        sessionId,
        guildId,
      });
      if (sent) {
        hasSentRequestRef.current = true;
      }
    }
  }, [sessionId, guildId]);

  useEffect(() => {
    if (questData !== null) return undefined;
    if (sessionHasNoQuest) return undefined;

    const retryIntervalMs = 1000;
    const intervalId = globalThis.setInterval(() => {
      if (sessionIdRef.current && guildIdRef.current && connectionRef.current) {
        connectionRef.current.send({
          type: 'quest-by-session-request',
          sessionId: sessionIdRef.current,
          guildId: guildIdRef.current,
        });
      }
    }, retryIntervalMs);

    return (): void => {
      globalThis.clearInterval(intervalId);
    };
  }, [questData, sessionHasNoQuest]);

  const requestRefresh = useCallback((): void => {
    if (sessionIdRef.current && guildIdRef.current) {
      connectionRef.current?.send({
        type: 'quest-by-session-request',
        sessionId: sessionIdRef.current,
        guildId: guildIdRef.current,
      });
    }
  }, []);

  return { questData, sessionHasNoQuest, requestRefresh };
};
