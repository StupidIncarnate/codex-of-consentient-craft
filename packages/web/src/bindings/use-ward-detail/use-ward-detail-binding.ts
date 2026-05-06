/**
 * PURPOSE: React hook that sends ward-detail-request via the shared WebSocket channel and returns
 * detail on response. Each requestDetail call subscribes once on wardDetailResponse$ filtered by
 * wardResultId and takes the first matching emission. A 30 s timeout guards against a dangling
 * subscription when the server never responds.
 *
 * USAGE:
 * const { detail, loading, requestDetail } = useWardDetailBinding({ questId });
 * requestDetail({ wardResultId });
 * // Returns { detail: unknown, loading: boolean } updated when ward-detail-response arrives
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { QuestId, WardResult } from '@dungeonmaster/shared/contracts';

import { rxjsFilterAdapter } from '../../adapters/rxjs/filter/rxjs-filter-adapter';
import { rxjsTakeAdapter } from '../../adapters/rxjs/take/rxjs-take-adapter';
import { rxjsTimeoutAdapter } from '../../adapters/rxjs/timeout/rxjs-timeout-adapter';
import { takeCountContract } from '../../contracts/take-count/take-count-contract';
import { timeoutMsContract } from '../../contracts/timeout-ms/timeout-ms-contract';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';

type WardResultId = WardResult['id'];

const WARD_DETAIL_TIMEOUT_MS = timeoutMsContract.parse(
  webConfigStatics.websocket.wardDetailTimeoutMs,
);
const ONE_EMISSION = takeCountContract.parse(1);

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

  // Track the active subscription so we can unsubscribe on a NEW requestDetail call
  // and on unmount. Avoids importing rxjs Subscription type directly.
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(
    () => (): void => {
      const sub = subscriptionRef.current;
      if (sub) sub.unsubscribe();
      subscriptionRef.current = null;
    },
    [],
  );

  const requestDetail = useCallback(
    ({ wardResultId }: { wardResultId: WardResultId }): void => {
      if (!questId) return;

      setLoading(true);

      const previousSub = subscriptionRef.current;
      if (previousSub) previousSub.unsubscribe();

      const filtered = rxjsFilterAdapter({
        source: webSocketChannelState.wardDetailResponse$(),
        predicate: (p) => p.wardResultId === wardResultId,
      });
      const oneShot = rxjsTakeAdapter({ source: filtered, count: ONE_EMISSION });
      const guarded = rxjsTimeoutAdapter({ source: oneShot, durationMs: WARD_DETAIL_TIMEOUT_MS });

      subscriptionRef.current = guarded.subscribe({
        next: (response) => {
          setDetail(response.detail);
          setLoading(false);
        },
        error: () => {
          // timeout or other rxjs error — clear loading
          setLoading(false);
        },
      });

      webSocketChannelState.sendWardDetailRequest({ questId, wardResultId });
    },
    [questId],
  );

  return { detail, loading, requestDetail };
};
