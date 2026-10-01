// PURPOSE: Proxy for quest-clarify-broker providing test control over HTTP responses. Composes the
// gateway's own fetchWithStatusProxy, which registers an MSW handler.
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { fetchWithStatusProxy } from '#gateway/browser/fetch/fetch-with-status/fetch-with-status.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;

export const questClarifyBrokerProxy = (): {
  setupClarify: (params: { chatProcessId: string }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupRefused: (params: { status: number; error: string }) => void;
  setupRefusedNoBody: (params: { status: number }) => void;
  setupRefusedRawBody: (params: { status: number; bodyText: string }) => void;
  setupError: () => void;
  getRequestCount: () => number;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  const statusFetchProxy = fetchWithStatusProxy();
  const address = { method: 'post', url: webConfigStatics.api.routes.questClarify } as const;

  return {
    setupClarify: ({ chatProcessId }) => {
      statusFetchProxy.setupResponse({
        ...address,
        status: OK_STATUS,
        bodyText: JSON.stringify({ chatProcessId }),
      });
    },
    setupInvalidResponse: ({ chatProcessId }) => {
      statusFetchProxy.setupResponse({
        ...address,
        status: OK_STATUS,
        bodyText: JSON.stringify({ chatProcessId }),
      });
    },
    setupRefused: ({ status, error }) => {
      statusFetchProxy.setupResponse({
        ...address,
        status,
        bodyText: JSON.stringify({ error }),
      });
    },
    setupRefusedNoBody: ({ status }) => {
      statusFetchProxy.setupResponse({ ...address, status, bodyText: '{}' });
    },
    setupRefusedRawBody: ({ status, bodyText }) => {
      statusFetchProxy.setupResponse({ ...address, status, bodyText });
    },
    setupError: () => {
      statusFetchProxy.setupRefused(address);
    },
    getRequestCount: (): number => statusFetchProxy.getRequestCount(address),
    getRequestBodies: async (): Promise<unknown[]> => statusFetchProxy.getRequestBodies(address),
  };
};
