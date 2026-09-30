/**
 * PURPOSE: Proxy for quest-start-broker providing test control over HTTP responses. Composes the
 * gateway's own `fetchWithStatusProxy`, which registers an MSW handler rather than spying on
 * `globalThis.fetch`.
 *
 * USAGE:
 * const proxy = questStartBrokerProxy();
 * proxy.setupStart({ processId });
 * await questStartBroker({ questId });
 */

import { fetchWithStatusProxy } from '#gateway/browser/fetch/fetch-with-status/fetch-with-status.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;
const BAD_REQUEST_STATUS = 400;

export const questStartBrokerProxy = (): {
  setupStart: (params: { processId: string }) => void;
  setupStartWithoutProcessId: () => void;
  setupRejected: (params: { error: string }) => void;
  setupRejectedNoBody: () => void;
  setupError: () => void;
  getRequestCount: () => number;
} => {
  const statusFetchProxy = fetchWithStatusProxy();
  const url = webConfigStatics.api.routes.questStart;

  return {
    setupStart: ({ processId }: { processId: string }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ processId }),
      });
    },
    setupStartWithoutProcessId: (): void => {
      statusFetchProxy.setupResponse({ method: 'post', url, status: OK_STATUS, bodyText: '{}' });
    },
    setupRejected: ({ error }: { error: string }): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: JSON.stringify({ error }),
      });
    },
    setupRejectedNoBody: (): void => {
      statusFetchProxy.setupResponse({
        method: 'post',
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: '{}',
      });
    },
    setupError: (): void => {
      statusFetchProxy.setupRefused({ method: 'post', url });
    },
    getRequestCount: (): number => statusFetchProxy.getRequestCount({ method: 'post', url }),
  };
};
