// PURPOSE: Proxy for guild-detail-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { Guild } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildDetailBrokerProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupError: () => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.guildById,
  });

  return {
    setupGuild: ({ guild }) => {
      endpoint.resolves({ data: guild });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
