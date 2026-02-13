// PURPOSE: Proxy for quest-detail-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { Quest } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questDetailBrokerProxy = (): {
  setupQuest: (params: { quest: Quest }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.questById,
  });

  return {
    setupQuest: ({ quest }) => {
      endpoint.resolves({ data: { quest } });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
