// PURPOSE: Proxy for project-remove-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchDeleteAdapterProxy } from '../../../adapters/fetch/delete/fetch-delete-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const projectRemoveBrokerProxy = (): {
  setupRemove: () => void;
  setupError: () => void;
} => {
  fetchDeleteAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'delete',
    url: webConfigStatics.api.routes.projectById,
  });

  return {
    setupRemove: () => {
      endpoint.resolves({ data: {} });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
