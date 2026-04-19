// PURPOSE: Proxy for quest-abandon-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questAbandonBrokerProxy = (): {
  setupAbandon: () => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questAbandon,
  });

  return {
    setupAbandon: (): void => {
      endpoint.resolves({ data: { abandoned: true } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
  };
};
