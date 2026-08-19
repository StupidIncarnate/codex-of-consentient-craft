import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';
import { HealthSnapshotStub } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type HealthSnapshot = ReturnType<typeof HealthSnapshotStub>;

export const healthGetBrokerProxy = (): {
  setupSnapshot: (params: { snapshot: HealthSnapshot }) => void;
  setupInvalidBody: () => void;
  setupServerError: () => void;
  setupNetworkError: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchGetAdapterProxy();
  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.health,
  });

  return {
    setupSnapshot: ({ snapshot }: { snapshot: HealthSnapshot }): void => {
      endpoint.resolves({ data: snapshot });
    },
    setupInvalidBody: (): void => {
      const { uptimeSeconds: _uptimeSeconds, ...rest } = HealthSnapshotStub();
      endpoint.resolves({ data: rest });
    },
    setupServerError: (): void => {
      endpoint.responds({ status: 500, body: { error: 'boom' } });
    },
    setupNetworkError: (): void => {
      endpoint.networkError();
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
