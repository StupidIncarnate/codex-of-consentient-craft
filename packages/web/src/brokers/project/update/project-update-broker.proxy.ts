// PURPOSE: Proxy for project-update-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { Project } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const projectUpdateBrokerProxy = (): {
  setupUpdate: (params: { project: Project }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchPatchAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'patch',
    url: webConfigStatics.api.routes.projectById,
  });

  return {
    setupUpdate: ({ project }) => {
      endpoint.resolves({ data: project });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
