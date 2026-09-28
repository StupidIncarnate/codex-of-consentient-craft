// PURPOSE: Proxy for orchestration-mode-get-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { OrchestrationMode } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationModeGetBrokerProxy = (): {
  setupMode: (params: { mode: OrchestrationMode }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.orchestrationMode } as const;

  return {
    setupMode: ({ mode }: { mode: OrchestrationMode }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { mode } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: data });
    },
  };
};
