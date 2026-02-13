// PURPOSE: Proxy for quest-modify-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPatchAdapterProxy } from '../../../adapters/fetch/patch/fetch-patch-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questModifyBrokerProxy = (): {
  setupModify: () => void;
  setupFailure: (params: { error: string }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchPatchAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'patch',
    url: webConfigStatics.api.routes.questById,
  });

  return {
    setupModify: () => {
      endpoint.resolves({ data: { success: true } });
    },
    setupFailure: ({ error }) => {
      endpoint.resolves({ data: { success: false, error } });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
