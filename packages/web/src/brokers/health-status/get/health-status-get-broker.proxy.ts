import type { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';
import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { fetchGetWithStatusAdapterProxy } from '../../../adapters/fetch/get-with-status/fetch-get-with-status-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type HealthStatusPayload = ReturnType<typeof HealthStatusPayloadStub>;

const SERVER_ERROR_STATUS = 500;

export const healthStatusGetBrokerProxy = (): {
  setupSeed: (params: { payload: HealthStatusPayload }) => void;
  setupServerError: () => void;
  setupUnreachable: () => void;
  setupInvalidBody: (params: { body: unknown }) => void;
  getRequestCount: () => RequestCount;
} => {
  fetchGetWithStatusAdapterProxy();

  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.healthStatus,
  });

  return {
    setupSeed: ({ payload }): void => {
      endpoint.resolves({ data: payload });
    },
    setupServerError: (): void => {
      endpoint.responds({ status: SERVER_ERROR_STATUS, body: { error: 'server exploded' } });
    },
    setupUnreachable: (): void => {
      endpoint.networkError();
    },
    setupInvalidBody: ({ body }): void => {
      endpoint.resolves({ data: body });
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
