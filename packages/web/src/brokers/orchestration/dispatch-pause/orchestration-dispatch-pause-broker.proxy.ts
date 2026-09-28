import type { DispatchState } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';
import type { RequestCount } from '@dungeonmaster/testing';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const orchestrationDispatchPauseBrokerProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
  getRequestCount: () => RequestCount;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = {
    method: 'post',
    url: webConfigStatics.api.routes.orchestrationDispatchPause,
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
