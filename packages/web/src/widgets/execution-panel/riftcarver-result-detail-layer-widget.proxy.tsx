import type { RequestCount } from '@dungeonmaster/testing';

import { questRiftcarverDetailBrokerProxy } from '../../brokers/quest/riftcarver-detail/quest-riftcarver-detail-broker.proxy';

export const RiftcarverResultDetailLayerWidgetProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  const broker = questRiftcarverDetailBrokerProxy();

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      broker.setupDetail({ detail });
    },
    setupNotFound: (): void => {
      broker.setupNotFound();
    },
    getRequestCount: (): RequestCount => broker.getRequestCount(),
  };
};
