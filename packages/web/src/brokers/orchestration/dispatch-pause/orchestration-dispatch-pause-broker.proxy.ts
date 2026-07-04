import type { DispatchState } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type EndpointControl = ReturnType<typeof StartEndpointMock.listen>;
type RequestCount = ReturnType<EndpointControl['getRequestCount']>;

export const orchestrationDispatchPauseBrokerProxy = (): {
  setupState: (params: { state: DispatchState }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
  getRequestCount: () => RequestCount;
} => {
  fetchPostAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.orchestrationDispatchPause,
  });

  return {
    setupState: ({ state }) => {
      endpoint.resolves({ data: { state } });
    },
    setupError: () => {
      endpoint.networkError();
    },
    setupInvalidResponse: ({ data }) => {
      endpoint.resolves({ data });
    },
    getRequestCount: () => endpoint.getRequestCount(),
  };
};
