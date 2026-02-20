// PURPOSE: Proxy for guild-session-resolve-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import type { SessionResolveResponse } from '../../../contracts/session-resolve-response/session-resolve-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildSessionResolveBrokerProxy = (): {
  setupResponse: (params: { response: SessionResolveResponse }) => void;
  setupError: () => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.guildSessionResolve,
  });

  return {
    setupResponse: ({ response }) => {
      endpoint.resolves({ data: response });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
