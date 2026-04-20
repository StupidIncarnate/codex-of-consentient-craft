// PURPOSE: Proxy for quest-resume-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questResumeBrokerProxy = (): {
  setupResume: (params: { restoredStatus: QuestStatus }) => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questResume,
  });

  return {
    setupResume: ({ restoredStatus }: { restoredStatus: QuestStatus }): void => {
      endpoint.resolves({ data: { resumed: true, restoredStatus } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
