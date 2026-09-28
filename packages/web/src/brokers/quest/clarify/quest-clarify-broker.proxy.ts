// PURPOSE: Proxy for quest-clarify-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { ProcessId } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questClarifyBrokerProxy = (): {
  setupClarify: (params: { chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
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
    getRequestCount: (): RequestCount => jsonFetchProxy.getRequestCount(address),
  };
};
