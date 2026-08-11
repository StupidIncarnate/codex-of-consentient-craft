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
  getRequestBodies: () => Promise<unknown[]>;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questResume,
  });

  return {
    setupResume: ({ restoredStatus }: { restoredStatus: QuestStatus }): void => {
      endpoint.resolves({
        data: { resumed: true, restoredStatus, dispatch: { started: true } },
      });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
    // What each received request actually carried, so a test can prove the POST is bodyless rather
    // than only that it happened. A bodyless request has no JSON to parse and is recorded as its
    // parse error; a `{}` on the wire records as `{}`, which is what this distinguishes.
    getRequestBodies: async (): Promise<unknown[]> => endpoint.getRequestBodies(),
  };
};
