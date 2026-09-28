// PURPOSE: Proxy for the broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { DirectoryEntry } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const directoryBrowseBrokerProxy = (): {
  setupEntries: (params: { entries: DirectoryEntry[] }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'post', url: webConfigStatics.api.routes.directoriesBrowse } as const;

  return {
    setupEntries: ({ entries }: { entries: DirectoryEntry[] }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: entries });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: data });
    },
  };
};
