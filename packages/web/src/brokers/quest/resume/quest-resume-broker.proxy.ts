// PURPOSE: Proxy for quest-resume-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { RequestCount } from '@dungeonmaster/testing';
import type { QuestStatus } from '@dungeonmaster/shared/contracts';
import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questResumeBrokerProxy = (): {
  setupResume: (params: { restoredStatus: QuestStatus }) => void;
  setupServerError: () => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'post', url: webConfigStatics.api.routes.questResume } as const;

  return {
    setupResume: ({ restoredStatus }: { restoredStatus: QuestStatus }): void => {
      jsonFetchProxy.setupSuccess({
        ...address,
        body: { resumed: true, restoredStatus, dispatch: { started: true } },
      });
    },
    setupServerError: (): void => {
      jsonFetchProxy.setupNotOk({
        ...address,
        status: 500,
        bodyText: 'Internal Server Error',
      });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    getRequestCount: (): RequestCount => jsonFetchProxy.getRequestCount(address),
    // What each received request actually carried, so a test can prove the POST is bodyless rather
    // than only that it happened. A bodyless request has no JSON to parse and is recorded as its
    // parse error; a `{}` on the wire records as `{}`, which is what this distinguishes.
    getRequestBodies: async (): Promise<unknown[]> => jsonFetchProxy.getRequestBodies(address),
  };
};
