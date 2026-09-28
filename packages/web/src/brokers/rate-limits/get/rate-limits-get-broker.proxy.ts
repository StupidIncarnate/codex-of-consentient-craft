// PURPOSE: Proxy for the broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const rateLimitsGetBrokerProxy = (): {
  setupSnapshot: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  setupError: () => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.rateLimits } as const;

  return {
    setupSnapshot: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { snapshot } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
  };
};
