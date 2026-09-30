import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPlayBrokerProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
  getRequestCount: () => number;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = {
    method: 'post',
    url: webConfigStatics.api.routes.orchestrationDispatchPlay,
  } as const;

  return {
    setupState: ({ state }) => {
      jsonFetchProxy.setupSuccess({ ...address, body: { state } });
    },
    setupError: () => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    setupInvalidResponse: ({ data }) => {
      jsonFetchProxy.setupSuccess({ ...address, body: data });
    },
    getRequestCount: () => jsonFetchProxy.getRequestCount(address),
  };
};
