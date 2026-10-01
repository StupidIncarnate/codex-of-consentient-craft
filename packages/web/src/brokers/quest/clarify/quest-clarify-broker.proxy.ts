// PURPOSE: Proxy for quest-clarify-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questClarifyBrokerProxy = (): {
  setupClarify: (params: { chatProcessId: string }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupError: () => void;
  getRequestCount: () => number;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'post', url: webConfigStatics.api.routes.questClarify } as const;

  return {
    setupClarify: ({ chatProcessId }) => {
      jsonFetchProxy.setupSuccess({ ...address, body: { chatProcessId } });
    },
    setupInvalidResponse: ({ chatProcessId }) => {
      jsonFetchProxy.setupSuccess({ ...address, body: { chatProcessId } });
    },
    setupError: () => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    getRequestCount: (): number => jsonFetchProxy.getRequestCount(address),
    getRequestBodies: async (): Promise<unknown[]> => jsonFetchProxy.getRequestBodies(address),
  };
};
