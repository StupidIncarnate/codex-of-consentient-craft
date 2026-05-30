import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questWardDetailBrokerProxy = (): {
  setupDetail: (params: { detail: unknown }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchGetAdapterProxy();
  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.questWardDetail,
  });

  return {
    setupDetail: ({ detail }: { detail: unknown }): void => {
      endpoint.resolves({ data: detail });
    },
    setupNotFound: (): void => {
      endpoint.responds({ status: 404, body: { error: 'Ward detail not available' } });
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
