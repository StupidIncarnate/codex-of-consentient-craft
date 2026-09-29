import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';
import type { RequestCount } from '@dungeonmaster/testing';

import { questWardDetailBrokerProxy } from '../../brokers/quest/ward-detail/quest-ward-detail-broker.proxy';

export const WardResultDetailLayerWidgetProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  consoleErrorProxy();
  const broker = questWardDetailBrokerProxy();

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
