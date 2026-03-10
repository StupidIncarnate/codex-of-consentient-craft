// PURPOSE: Proxy for quest-start-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questStartBrokerProxy = (): {
  setupStart: (params: { processId: string }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questStart,
  });

  return {
    setupStart: ({ processId }): void => {
      endpoint.resolves({ data: { processId } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
  };
};
