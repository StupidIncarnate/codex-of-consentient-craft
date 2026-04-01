import type { ProcessId } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const sessionClarifyBrokerProxy = (): {
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const clarifyEndpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.sessionClarify,
  });

  return {
    setupClarify: ({ chatProcessId }) => {
      clarifyEndpoint.resolves({ data: { chatProcessId } });
    },
    setupInvalidResponse: ({ chatProcessId }) => {
      clarifyEndpoint.resolves({ data: { chatProcessId } });
    },
    setupError: () => {
      clarifyEndpoint.networkError();
    },
  };
};
