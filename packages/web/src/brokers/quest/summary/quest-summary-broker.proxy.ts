// PURPOSE: Proxy for quest-summary-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { RequestCount } from '@dungeonmaster/testing';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts/quest-summary/quest-summary.stub';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type QuestSummary = ReturnType<typeof QuestSummaryStub>;

export const questSummaryBrokerProxy = (): {
  setupSummary: (params: { summary: QuestSummary }) => void;
  setupNotFound: () => void;
  getRequestCount: () => RequestCount;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.questSummary } as const;

  return {
    setupSummary: ({ summary }: { summary: QuestSummary }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: summary });
    },
    setupNotFound: (): void => {
      jsonFetchProxy.setupNotOk({
        ...address,
        status: 404,
        bodyText: JSON.stringify({ error: 'Quest with id "q-missing" not found in any guild' }),
      });
    },
    getRequestCount: (): RequestCount => jsonFetchProxy.getRequestCount(address),
  };
};
