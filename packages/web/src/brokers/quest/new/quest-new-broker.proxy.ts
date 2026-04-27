// PURPOSE: Proxy for quest-new-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questNewBrokerProxy = (): {
  setupNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { questId: unknown; chatProcessId: unknown }) => void;
  setupError: () => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questNew,
  });

  return {
    setupNew: ({ questId, chatProcessId }) => {
      endpoint.resolves({ data: { questId, chatProcessId } });
    },
    setupInvalidResponse: ({ questId, chatProcessId }) => {
      endpoint.resolves({ data: { questId, chatProcessId } });
    },
    setupError: () => {
      endpoint.networkError();
    },
  };
};
