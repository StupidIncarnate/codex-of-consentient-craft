// PURPOSE: Proxy for guild-chat-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { ProcessId } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildChatBrokerProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.guildChat,
  });

  return {
    setupChat: ({ chatProcessId }) => {
      endpoint.resolves({ data: { chatProcessId } });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
