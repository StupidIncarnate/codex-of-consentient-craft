// PURPOSE: Proxy for quest-start-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchPostWithStatusAdapterProxy } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const BAD_REQUEST_STATUS = 400;

export const questStartBrokerProxy = (): {
  setupStart: (params: { processId: string }) => void;
  setupStartWithoutProcessId: () => void;
  setupRejected: (params: { error: string }) => void;
  setupRejectedNoBody: () => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchPostWithStatusAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questStart,
  });

  return {
    setupStart: ({ processId }): void => {
      endpoint.resolves({ data: { processId } });
    },
    setupStartWithoutProcessId: (): void => {
      endpoint.resolves({ data: {} });
    },
    setupRejected: ({ error }): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: { error } });
    },
    setupRejectedNoBody: (): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: {} });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
