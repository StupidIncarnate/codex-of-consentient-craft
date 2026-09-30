import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';

import { questRiftcarverDetailBrokerProxy } from '../../brokers/quest/riftcarver-detail/quest-riftcarver-detail-broker.proxy';

export const RiftcarverResultDetailLayerWidgetProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getRequestCount: () => number;
} => {
  consoleErrorProxy();
  const broker = questRiftcarverDetailBrokerProxy();

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      broker.setupDetail({ detail });
    },
    setupNotFound: (): void => {
      broker.setupNotFound();
    },
    getRequestCount: (): number => broker.getRequestCount(),
  };
};
