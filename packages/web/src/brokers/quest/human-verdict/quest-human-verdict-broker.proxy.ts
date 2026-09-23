// PURPOSE: Proxy for quest-human-verdict-broker providing test control over HTTP responses, plus
// getRequestBodies() to assert the exact posted body.
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior.

import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchPostWithStatusAdapterProxy } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const BAD_REQUEST_STATUS = 400;

export const questHumanVerdictBrokerProxy = (): {
  setupRecorded: () => void;
  setupRefused: (params: { error: string }) => void;
  setupBadRequestNoBody: () => void;
  setupBadRequestOkBody: () => void;
  setupNetworkError: () => void;
  setupHeld: () => { release: () => void };
  getRequestBodies: () => Promise<unknown[]>;
  getRequestCount: () => RequestCount;
} => {
  fetchPostWithStatusAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.questHumanVerdict,
  });

  return {
    setupRecorded: (): void => {
      endpoint.resolves({ data: { ok: true } });
    },
    setupRefused: ({ error }: { error: string }): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: { error } });
    },
    setupBadRequestNoBody: (): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: {} });
    },
    // A malformed server response: a non-2xx status carrying the SUCCESS body shape anyway. The
    // status is the authority — `result.ok` must gate the parsed body, not the other way round.
    setupBadRequestOkBody: (): void => {
      endpoint.responds({ status: BAD_REQUEST_STATUS, body: { ok: true } });
    },
    setupNetworkError: (): void => {
      endpoint.networkError();
    },
    // Answers only once release() is called — lets a test assert the in-flight disabled state a
    // same-tick setupRecorded() settles too fast to observe.
    setupHeld: (): { release: () => void } => endpoint.holdsOpen({ data: { ok: true } }),
    getRequestBodies: async (): Promise<unknown[]> => endpoint.getRequestBodies(),
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
