import type { DispatchState } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostWithStatusAdapterProxy } from '../../../adapters/fetch/post-with-status/fetch-post-with-status-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type EndpointControl = ReturnType<typeof StartEndpointMock.listen>;
type RequestCount = ReturnType<EndpointControl['getRequestCount']>;

export const orchestrationDispatchPlayBrokerProxy = (): {
  setupAllowed: (params: { state: DispatchState }) => void;
  setupDenied: (params: { reason: string; state: DispatchState }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
  getRequestCount: () => RequestCount;
} => {
  fetchPostWithStatusAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'post',
    url: webConfigStatics.api.routes.orchestrationDispatchPlay,
  });

  return {
    setupAllowed: ({ state }) => {
      endpoint.resolves({ data: { allowed: true, state } });
    },
    setupDenied: ({ reason, state }) => {
      endpoint.responds({ status: 409, body: { allowed: false, reason, state } });
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
