// PURPOSE: Proxy for quest-modify-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { Quest } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questModifyBrokerProxy = (): {
  setupModify: (params: { quest: Quest }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchPatchAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'patch',
    url: webConfigStatics.api.routes.questById,
  });

  return {
    setupModify: ({ quest }) => {
      endpoint.resolves({ data: quest });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
