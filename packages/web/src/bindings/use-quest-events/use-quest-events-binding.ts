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
import { questBySessionNotFoundPayloadContract } from '../../contracts/quest-by-session-not-found-payload/quest-by-session-not-found-payload-contract';
import { questModifiedPayloadContract } from '../../contracts/quest-modified-payload/quest-modified-payload-contract';

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
          const payloadResult = questBySessionNotFoundPayloadContract.safeParse(
            parsed.data.payload,
          );
          if (!payloadResult.success) return;
          if (payloadResult.data.sessionId === sessionIdRef.current) {
            setSessionHasNoQuest(true);
          }
          return;
        }

        if (parsed.data.type === 'quest-modified') {
          const payloadResult = questModifiedPayloadContract.safeParse(parsed.data.payload);
          if (!payloadResult.success) return;

          const questParsed = questContract.safeParse(payloadResult.data.quest);
          if (!questParsed.success) return;

          const hasMatchingWorkItem = questParsed.data.workItems.some(
            (wi) => wi.sessionId === sessionIdRef.current,
          );
          if (sessionIdRef.current && !hasMatchingWorkItem) {
            return;
          }

          const payloadQuestId = payloadResult.data.questId;

          if (questIdRef.current === null) {
            questIdRef.current = payloadQuestId;
          }

          if (payloadQuestId !== questIdRef.current) {
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
