// PURPOSE: Proxy for quest-verify-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import type { QuestVerifyResult } from '../../../contracts/quest-verify-result/quest-verify-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questVerifyBrokerProxy = (): {
  setupVerify: (params: { result: QuestVerifyResult }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questVerify,
  });

  return {
    setupVerify: ({ result }) => {
      endpoint.resolves({ data: result });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
  };
};
