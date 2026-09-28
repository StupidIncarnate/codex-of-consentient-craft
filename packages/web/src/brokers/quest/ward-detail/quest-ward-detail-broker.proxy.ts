// PURPOSE: Proxy for quest-ward-detail-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { RequestCount } from '@dungeonmaster/testing';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questWardDetailBrokerProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.questWardDetail } as const;

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: detail });
    },
    setupNotFound: (): void => {
      jsonFetchProxy.setupNotOk({
        ...address,
        status: 404,
        bodyText: JSON.stringify({ error: 'Ward detail not available' }),
      });
    },
    getRequestCount: (): RequestCount => jsonFetchProxy.getRequestCount(address),
  };
};
