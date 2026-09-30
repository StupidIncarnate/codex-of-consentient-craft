/**
 * PURPOSE: Proxy for quest-human-verdict-broker providing test control over HTTP responses, plus
 * getRequestBodies() to assert the exact posted body. Composes the gateway's own
 * `fetchWithStatusProxy`, which registers an MSW handler rather than spying on `globalThis.fetch`.
 *
 * USAGE:
 * const proxy = questHumanVerdictBrokerProxy();
 * proxy.setupRecorded();
 * await questHumanVerdictBroker({ questId, unitId, outcome, reason });
 */

import { fetchWithStatusProxy } from '#gateway/browser/fetch/fetch-with-status/fetch-with-status.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;
const BAD_REQUEST_STATUS = 400;

export const questHumanVerdictBrokerProxy = (): {
  setupRecorded: () => void;
  setupRefused: (params: { error: string }) => void;
  setupBadRequestNoBody: () => void;
  setupBadRequestOkBody: () => void;
  setupNetworkError: () => void;
  setupHeld: () => { release: () => void };
  getRequestBodies: () => Promise<unknown[]>;
  getRequestCount: () => number;
} => {
  const statusFetchProxy = fetchWithStatusProxy();
  const url = webConfigStatics.api.routes.questHumanVerdict;

  return {
    setupRecorded: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ ok: true }),
      });
    },
    setupRefused: ({ error }: { error: string }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: JSON.stringify({ error }),
      });
    },
    setupBadRequestNoBody: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: '{}',
      });
    },
    // A malformed server response: a non-2xx status carrying the SUCCESS body shape anyway. The
    // status is the authority — `result.ok` must gate the parsed body, not the other way round.
    setupBadRequestOkBody: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: JSON.stringify({ ok: true }),
      });
    },
    setupNetworkError: (): void => {
      statusFetchProxy.setupRefused({ method: 'post', url });
    },
    // Answers only once release() is called — lets a test assert the in-flight disabled state a
    // same-tick setupRecorded() settles too fast to observe.
    setupHeld: (): { release: () => void } =>
      statusFetchProxy.setupHeld({
        method: 'post',
        url,
        bodyText: JSON.stringify({ ok: true }),
      }),
    getRequestBodies: async (): Promise<unknown[]> =>
      statusFetchProxy.getRequestBodies({ method: 'post', url }),
    getRequestCount: (): number => statusFetchProxy.getRequestCount({ method: 'post', url }),
  };
};
