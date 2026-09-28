// PURPOSE: Proxy for the broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questQueueBrokerProxy = (): {
  setupEntries: (params: { entries: readonly QuestQueueEntry[] }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.questsQueue } as const;

  return {
    setupEntries: ({ entries }: { entries: readonly QuestQueueEntry[] }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { entries } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: data });
    },
  };
};
