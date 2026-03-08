// PURPOSE: Proxy for design-start-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { Quest } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const designStartBrokerProxy = (): {
  setupStart: (params: { port: Quest['designPort'] }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.designStart,
  });

  return {
    setupStart: ({ port }): void => {
      endpoint.resolves({ data: { port } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
  };
};
