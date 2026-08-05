// PURPOSE: Proxy for quest-comment-batch-broker providing test control over HTTP responses plus
// captured-request-body reads (fetchSpy wraps the already-MSW-patched globalThis.fetch, so
// passthrough still hits the mocked endpoint — see quest-delete-broker.proxy.ts for precedent).
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior, then
// getRequestBody() to assert the posted body.

import { StartEndpointMock } from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fetchPostWithStatusAdapterProxy } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter.proxy';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const BAD_REQUEST_STATUS = 400;
const NOT_FOUND_STATUS = 404;
const SERVER_ERROR_STATUS = 500;

type EndpointControl = ReturnType<typeof StartEndpointMock.listen>;
type RequestCount = ReturnType<EndpointControl['getRequestCount']>;

export const questCommentBatchBrokerProxy = (): {
  setupSent: (params: { chatProcessId: string }) => void;
  setupSentWithDeliveredMessage: (params: {
    chatProcessId: string;
    deliveredMessage: string;
  }) => void;
  setupSentWithoutChatProcessId: () => void;
  setupSentUnparseableBody: () => void;
  setupStaleAnchors: (params: { staleAnchors: unknown[] }) => void;
  setupStaleAnchorsEmpty: () => void;
  setupBadRequest: () => void;
  setupNotFound: () => void;
  setupServerError: (params: { error: string }) => void;
  setupServerErrorNoBody: () => void;
  setupNetworkError: () => void;
  getRequestBody: () => unknown;
  getRequestCount: () => RequestCount;
} => {
  fetchPostWithStatusAdapterProxy();

  const fetchSpy = registerSpyOn({ object: globalThis, method: 'fetch', passthrough: true });

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questComments,
  });

  return {
    setupSent: ({ chatProcessId }): void => {
      endpoint.resolves({ data: { chatProcessId } });
    },
    setupSentWithDeliveredMessage: ({ chatProcessId, deliveredMessage }): void => {
      endpoint.resolves({ data: { chatProcessId, deliveredMessage } });
    },
    setupSentWithoutChatProcessId: (): void => {
      endpoint.resolves({ data: {} });
    },
    setupSentUnparseableBody: (): void => {
      endpoint.resolves({ data: 'not-an-object' });
    },
    setupStaleAnchors: ({ staleAnchors }): void => {
      endpoint.responds({ status: httpStatusStatics.conflict, body: { staleAnchors } });
    },
    setupStaleAnchorsEmpty: (): void => {
      endpoint.responds({ status: httpStatusStatics.conflict, body: { staleAnchors: [] } });
    },
    setupBadRequest: (): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: {} });
    },
    setupNotFound: (): void => {
      endpoint.responds({ status: NOT_FOUND_STATUS, body: {} });
    },
    setupServerError: ({ error }): void => {
      endpoint.responds({ status: SERVER_ERROR_STATUS, body: { error } });
    },
    setupServerErrorNoBody: (): void => {
      endpoint.responds({ status: SERVER_ERROR_STATUS });
    },
    setupNetworkError: (): void => {
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
