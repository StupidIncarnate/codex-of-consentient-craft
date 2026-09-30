// PURPOSE: Proxy for quest-riftcarver-detail-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior


import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questRiftcarverDetailBrokerProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getRequestCount: () => number;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = {
    method: 'get',
    url: webConfigStatics.api.routes.questRiftcarverDetail,
  } as const;

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: detail });
    },
    setupNotFound: (): void => {
      jsonFetchProxy.setupNotOk({
        ...address,
        status: 404,
        bodyText: JSON.stringify({ error: 'Riftcarver detail not available' }),
      });
    },
    getRequestCount: (): number => jsonFetchProxy.getRequestCount(address),
  };
};
