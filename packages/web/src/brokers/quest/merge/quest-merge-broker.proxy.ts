// PURPOSE: Proxy for quest-merge-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questMergeBrokerProxy = (): {
  setupMerge: (params: { merging: boolean }) => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questMerge,
  });

  return {
    setupMerge: ({ merging }): void => {
      endpoint.resolves({ data: { merging } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
