// PURPOSE: Proxy for quest-followup-stop-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questFollowupStopBrokerProxy = (): {
  setupStopped: () => void;
  setupNothingRunning: () => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questFollowupStop,
  });

  return {
    setupStopped: (): void => {
      endpoint.resolves({ data: { stopped: true } });
    },
    // The server's answer when the reader pressed STOP either side of a turn — a 200, not an error.
    setupNothingRunning: (): void => {
      endpoint.resolves({ data: { stopped: false } });
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
