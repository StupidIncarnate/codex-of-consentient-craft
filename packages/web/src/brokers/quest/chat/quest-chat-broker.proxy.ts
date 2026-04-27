// PURPOSE: Proxy for quest-chat-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { ProcessId } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatBrokerProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questChat,
  });

  return {
    setupChat: ({ chatProcessId }) => {
      endpoint.resolves({ data: { chatProcessId } });
    },
    setupInvalidResponse: ({ chatProcessId }) => {
      endpoint.resolves({ data: { chatProcessId } });
    },
    setupError: () => {
      endpoint.networkError();
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
