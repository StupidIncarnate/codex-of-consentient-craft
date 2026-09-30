// PURPOSE: Proxy for quest-projection-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts/quest-projection/quest-projection.stub';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

type QuestProjection = ReturnType<typeof QuestProjectionStub>;

export const questProjectionBrokerProxy = (): {
  setupProjection: (params: { projection: QuestProjection }) => void;
  setupNotFound: () => void;
  getRequestCount: () => number;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.questProjection } as const;

  return {
    setupProjection: ({ projection }: { projection: QuestProjection }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: projection });
    },
    setupNotFound: (): void => {
      jsonFetchProxy.setupNotOk({
        ...address,
        status: 404,
        bodyText: JSON.stringify({ error: 'Quest with id "q-missing" not found in any guild' }),
      });
    },
    getRequestCount: (): number => jsonFetchProxy.getRequestCount(address),
  };
};
