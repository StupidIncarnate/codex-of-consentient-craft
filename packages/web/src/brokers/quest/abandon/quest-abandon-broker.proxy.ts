// PURPOSE: Proxy for quest-abandon-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questAbandonBrokerProxy = (): {
  setupAbandon: () => void;
  setupError: () => void;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questAbandon,
  });

  return {
    setupAbandon: (): void => {
      endpoint.resolves({ data: { abandoned: true } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    // What each received request actually carried, so a test can prove the POST is bodyless rather
    // than only that it happened. A bodyless request has no JSON to parse and is recorded as its
    // parse error; a `{}` on the wire records as `{}`, which is what this distinguishes.
    getRequestBodies: async (): Promise<unknown[]> => endpoint.getRequestBodies(),
  };
};
