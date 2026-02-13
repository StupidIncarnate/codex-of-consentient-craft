import type { DirectoryEntry } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapterProxy } from '../../../adapters/fetch/post/fetch-post-adapter.proxy';

export const directoryBrowseBrokerProxy = (): {
  setupEntries: (params: { entries: DirectoryEntry[] }) => void;
  setupError: (params: { error: Error }) => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const fetchProxy = fetchPostAdapterProxy();

  return {
    setupEntries: ({ entries }: { entries: DirectoryEntry[] }): void => {
      fetchProxy.resolves({ data: entries });
    },
    setupError: ({ error }: { error: Error }): void => {
      fetchProxy.rejects({ error });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      fetchProxy.resolves({ data });
    },
  };
};
