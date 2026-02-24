/**
 * PURPOSE: React hook that listens for quest-modified WebSocket events for a specific quest and triggers a callback
 *
 * USAGE:
 * useQuestEventsBinding({questId, onQuestModified: () => refetch()});
 * // Opens WS, filters for quest-modified matching questId, calls onQuestModified
 */
import { useEffect, useRef } from 'react';

import type { QuestId } from '@dungeonmaster/shared/contracts';
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';

export const useQuestEventsBinding = ({
  questId,
  onQuestModified,
}: {
  questId: QuestId | null;
  onQuestModified: () => void;
}): void => {
  const callbackRef = useRef(onQuestModified);
  callbackRef.current = onQuestModified;

  useEffect(() => {
    if (!questId) return undefined;

    const connection = websocketConnectAdapter({
      url: `ws://${globalThis.location.host}/ws`,
      onMessage: (message: unknown): void => {
        const parsed = wsMessageContract.safeParse(message);
        if (!parsed.success) return;

        if (parsed.data.type === 'quest-modified') {
          const payloadQuestId: unknown = Reflect.get(parsed.data.payload, 'questId');
          if (payloadQuestId === questId) {
            callbackRef.current();
          }
        }
      },
    });

    return (): void => {
      connection.close();
    };
  }, [questId]);
};
