import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';
import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

export const questProjectionBrokerProxy = (): {
  setupProjection: (params: { projection: QuestProjection }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchGetAdapterProxy();
  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.questProjection,
  });

  return {
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      endpoint.resolves({ data: projection });
    },
    setupNotFound: (): void => {
      endpoint.responds({
        status: 404,
        body: { error: 'Quest with id "q-missing" not found in any guild' },
      });
    },
    getRequestCount: (): RequestCount => endpoint.getRequestCount(),
  };
};
