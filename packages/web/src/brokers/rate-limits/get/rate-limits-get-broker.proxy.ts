import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const rateLimitsGetBrokerProxy = (): {
  setupSnapshot: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  setupError: () => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.rateLimits,
  });

  return {
    setupSnapshot: ({ snapshot }) => {
      endpoint.resolves({ data: { snapshot } });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
