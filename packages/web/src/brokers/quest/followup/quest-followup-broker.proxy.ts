// PURPOSE: Proxy for quest-followup-broker providing test control over HTTP responses plus
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior, then
// getRequestBody() to assert the posted body.

import { StartEndpointMock } from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fetchPostWithStatusAdapterProxy } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const BAD_REQUEST_STATUS = 400;

type EndpointControl = ReturnType<typeof StartEndpointMock.listen>;
type RequestCount = ReturnType<EndpointControl['getRequestCount']>;

export const questFollowupBrokerProxy = (): {
  setupFollowup: (params: { chatProcessId: string }) => void;
  setupFollowupWithoutChatProcessId: () => void;
  setupRejected: (params: { error: string }) => void;
  setupRejectedNoBody: () => void;
  setupError: () => void;
  getRequestBody: () => unknown;
  getRequestCount: () => RequestCount;
} => {
  fetchPostWithStatusAdapterProxy();
  const fetchSpy = registerSpyOn({ object: globalThis, method: 'fetch', passthrough: true });

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questFollowup,
  });

  return {
    setupFollowup: ({ chatProcessId }): void => {
      endpoint.resolves({ data: { chatProcessId } });
    },
    setupFollowupWithoutChatProcessId: (): void => {
      endpoint.resolves({ data: {} });
    },
    setupRejected: ({ error }): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: { error } });
    },
    setupRejectedNoBody: (): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: {} });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    // This broker only ever issues POST requests — that's the one real invariant to address by.
    getRequestBody: (): unknown => {
      const lastCall = fetchSpy.callsMatching([(): boolean => true, { method: 'POST' }]).at(-1);
      if (!lastCall) {
        return null;
      }
      const init = lastCall[1] as RequestInit | undefined;
      if (typeof init?.body !== 'string') {
        return null;
      }
      return JSON.parse(init.body) as unknown;
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
