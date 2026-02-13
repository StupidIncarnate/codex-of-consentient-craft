// PURPOSE: Proxy for process-status-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { OrchestrationStatus } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const processStatusBrokerProxy = (): {
  setupStatus: (params: { status: OrchestrationStatus }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchGetAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.processStatus,
  });

  return {
    setupStatus: ({ status }) => {
      endpoint.resolves({ data: status });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
