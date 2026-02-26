/**
 * PURPOSE: React hook that owns quest state from WebSocket events, subscribing to quest-modified and quest-session-linked messages
 *
 * USAGE:
 * const {questData} = useQuestEventsBinding({questId, chatProcessId});
 * // Returns {questData: Quest | null} updated in real-time via WS
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProcessId, Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { questContract, wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';

type WsConnection = ReturnType<typeof websocketConnectAdapter>;

export const useQuestEventsBinding = ({
  questId,
  chatProcessId,
}: {
  questId: QuestId | null;
  chatProcessId: ProcessId | null;
}): { questData: Quest | null; requestRefresh: () => void } => {
  const [questData, setQuestData] = useState<Quest | null>(null);
  const questIdRef = useRef<QuestId | null>(questId);
  const chatProcessIdRef = useRef<ProcessId | null>(chatProcessId);
  const connectionRef = useRef<WsConnection | null>(null);
  const hasSentRequestRef = useRef<QuestId | null>(null);

  questIdRef.current = questId;
  chatProcessIdRef.current = chatProcessId;

  useEffect(() => {
    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onOpen: (): void => {
        if (questIdRef.current && hasSentRequestRef.current !== questIdRef.current) {
          const sent = connectionRef.current?.send({
            type: 'quest-data-request',
            questId: questIdRef.current,
          });
          if (sent) {
            hasSentRequestRef.current = questIdRef.current;
          }
        }
      },
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;

        if (parsed.data.type === 'quest-modified') {
          const payloadQuestId: unknown = Reflect.get(parsed.data.payload, 'questId');
          if (payloadQuestId === questIdRef.current) {
            const rawQuest: unknown = Reflect.get(parsed.data.payload, 'quest');
            const questParsed = questContract.safeParse(rawQuest);
            if (questParsed.success) {
              setQuestData(questParsed.data);
            }
          }
        }

        if (parsed.data.type === 'quest-session-linked') {
          const payloadChatProcessId: unknown = Reflect.get(parsed.data.payload, 'chatProcessId');
          if (payloadChatProcessId === chatProcessIdRef.current) {
            const payloadQuestId: unknown = Reflect.get(parsed.data.payload, 'questId');
            if (typeof payloadQuestId === 'string') {
              questIdRef.current = payloadQuestId as QuestId;
              connection.send({
                type: 'quest-data-request',
                questId: payloadQuestId,
              });
              hasSentRequestRef.current = payloadQuestId as QuestId;
            }
          }
        }
      },
    });

    connectionRef.current = connection;

    if (questIdRef.current && hasSentRequestRef.current !== questIdRef.current) {
      const sent = connection.send({ type: 'quest-data-request', questId: questIdRef.current });
      if (sent) {
        hasSentRequestRef.current = questIdRef.current;
      }
    }

    return (): void => {
      connectionRef.current = null;
      hasSentRequestRef.current = null;
      connection.close();
    };
  }, []);

  useEffect(() => {
    if (questId && hasSentRequestRef.current !== questId) {
      const sent = connectionRef.current?.send({ type: 'quest-data-request', questId });
      if (sent) {
        hasSentRequestRef.current = questId;
      }
    }
  }, [questId]);

  const requestRefresh = useCallback((): void => {
    if (questIdRef.current) {
      connectionRef.current?.send({
        type: 'quest-data-request',
        questId: questIdRef.current,
      });
    }
  }, []);

  return { questData, requestRefresh };
};
