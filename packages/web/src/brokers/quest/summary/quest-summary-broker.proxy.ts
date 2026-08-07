import { StartEndpointMock } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapterProxy } from '../../../adapters/fetch/get/fetch-get-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type QuestSummary = ReturnType<typeof QuestSummaryStub>;

export const questSummaryBrokerProxy = (): {
  setupSummary: (params: { summary: QuestSummary }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  fetchGetAdapterProxy();
  const endpoint = StartEndpointMock.listen({
    method: 'get',
    url: webConfigStatics.api.routes.questSummary,
  });

  return {
    setupSummary: ({ summary }: { summary: QuestSummary }): void => {
      endpoint.resolves({ data: summary });
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
