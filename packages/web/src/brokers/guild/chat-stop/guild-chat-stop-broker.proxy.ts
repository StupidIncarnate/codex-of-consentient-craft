// PURPOSE: Proxy for guild-chat-stop-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildChatStopBrokerProxy = (): {
  setupStop: () => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.guildChatStop,
  });

  return {
    setupStop: () => {
      endpoint.resolves({ data: { stopped: true } });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
