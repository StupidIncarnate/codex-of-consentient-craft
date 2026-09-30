/**
 * PURPOSE: Proxy for quest-comment-batch-broker providing test control over HTTP responses plus
 * read-back of the posted body. Composes the gateway's own `fetchWithStatusProxy`, which registers
 * an MSW handler rather than spying on `globalThis.fetch` directly, so this coexists in a shared
 * test file with sibling proxies still staged through `StartEndpointMock` directly.
 *
 * USAGE:
 * Create proxy in test, use setup methods to configure endpoint behavior, then
 * await getRequestBody() to assert the posted body.
 */


import { fetchWithStatusProxy } from '#gateway/browser/fetch/fetch-with-status/fetch-with-status.proxy';

import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const BAD_REQUEST_STATUS = 400;
const NOT_FOUND_STATUS = 404;
const SERVER_ERROR_STATUS = 500;

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
  getRequestBody: () => Promise<unknown>;
  getRequestCount: () => number;
} => {
  const statusFetchProxy = fetchWithStatusProxy();
  const url = webConfigStatics.api.routes.questComments;

  return {
    setupSent: ({ chatProcessId }: { chatProcessId: string }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: 200,
        bodyText: JSON.stringify({ chatProcessId }),
      });
    },
    setupSentWithDeliveredMessage: ({
      chatProcessId,
      deliveredMessage,
    }: {
      chatProcessId: string;
      deliveredMessage: string;
    }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: 200,
        bodyText: JSON.stringify({ chatProcessId, deliveredMessage }),
      });
    },
    setupSentWithoutChatProcessId: (): void => {
      statusFetchProxy.setupResponse({ method: 'post', url, status: 200, bodyText: '{}' });
    },
    setupSentUnparseableBody: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: 200,
        bodyText: 'not-an-object',
      });
    },
    setupStaleAnchors: ({ staleAnchors }: { staleAnchors: unknown[] }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: httpStatusStatics.conflict,
        bodyText: JSON.stringify({ staleAnchors }),
      });
    },
    setupStaleAnchorsEmpty: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: httpStatusStatics.conflict,
        bodyText: JSON.stringify({ staleAnchors: [] }),
      });
    },
    setupBadRequest: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: '{}',
      });
    },
    setupNotFound: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: NOT_FOUND_STATUS,
        bodyText: '{}',
      });
    },
    setupServerError: ({ error }: { error: string }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: SERVER_ERROR_STATUS,
        bodyText: JSON.stringify({ error }),
      });
    },
    setupServerErrorNoBody: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: SERVER_ERROR_STATUS,
        bodyText: '',
      });
    },
    setupNetworkError: (): void => {
      statusFetchProxy.setupRefused({ method: 'post', url });
    },
    // This broker only ever issues one POST per call — the last body read back is the one this
    // call's own request sent.
    getRequestBody: async (): Promise<unknown> => {
      const bodies = await statusFetchProxy.getRequestBodies({ method: 'post', url });
      return bodies.at(-1) ?? null;
    },
    getRequestCount: (): number => statusFetchProxy.getRequestCount({ method: 'post', url }),
  };
};
