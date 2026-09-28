// PURPOSE: Proxy for the broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchGetBrokerProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = {
    method: 'get',
    url: webConfigStatics.api.routes.orchestrationDispatch,
  } as const;

  return {
    setupState: ({ state }: { state: DispatchState }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { state } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: data });
    },
  };
};
