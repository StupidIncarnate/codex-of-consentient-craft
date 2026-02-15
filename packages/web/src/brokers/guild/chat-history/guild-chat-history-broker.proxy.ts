// PURPOSE: Proxy for guild-chat-history-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildChatHistoryBrokerProxy = (): {
  setupHistory: (params: { entries: unknown[] }) => void;
  setupError: () => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.guildChatHistory,
  });

  return {
    setupHistory: ({ entries }) => {
      endpoint.resolves({ data: entries });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
