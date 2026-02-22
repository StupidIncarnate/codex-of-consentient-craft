// PURPOSE: Proxy for guild-session-list-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildSessionListBrokerProxy = (): {
  setupSessions: (params: { sessions: unknown[] }) => void;
  setupError: () => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.guildSessions,
  });

  return {
    setupSessions: ({ sessions }) => {
      endpoint.resolves({ data: sessions });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
