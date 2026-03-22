/**
 * PURPOSE: React hook that sends ward-detail-request via WebSocket and returns detail on response
 *
 * USAGE:
 * const { detail, loading } = useWardDetailBinding({ questId, wardResultId, connection });
 * // Returns { detail: unknown, loading: boolean } updated when ward-detail-response arrives
 */

import { useCallback, useRef, useState } from 'react';

import type { QuestId } from '@dungeonmaster/shared/contracts';
import type { WardResult } from '@dungeonmaster/shared/contracts';

import { websocketConnectAdapter } from '../../adapters/websocket/connect/websocket-connect-adapter';

type WardResultId = WardResult['id'];

export const useWardDetailBinding = ({
  questId,
}: {
  questId: QuestId | null;
}): {
  detail: unknown;
  loading: boolean;
  requestDetail: ({ wardResultId }: { wardResultId: WardResultId }) => void;
} => {
  const [detail, setDetail] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const connectionRef = useRef<ReturnType<typeof websocketConnectAdapter> | null>(null);

  const requestDetail = useCallback(
    ({ wardResultId }: { wardResultId: WardResultId }): void => {
      if (!questId) return;

      setLoading(true);

      const connection = websocketConnectAdapter({
        url: `ws://${globalThis.location.host}/ws`,
        onMessage: (message: unknown): void => {
          if (typeof message !== 'object' || message === null) return;

          const type: unknown = Reflect.get(message, 'type');
          if (type !== 'ward-detail-response') return;

          const responseWardResultId: unknown = Reflect.get(message, 'wardResultId');
          if (responseWardResultId !== wardResultId) return;

          const responseDetail: unknown = Reflect.get(message, 'detail');
          setDetail(responseDetail);
          setLoading(false);
          connection.close();
        },
      });

      connectionRef.current = connection;

      connection.send({
        type: 'ward-detail-request',
        questId,
        wardResultId,
      });
    },
    [questId],
  );

  return { detail, loading, requestDetail };
};
