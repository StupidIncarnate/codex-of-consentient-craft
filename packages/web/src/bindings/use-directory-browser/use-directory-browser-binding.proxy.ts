import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts';

import { directoryBrowseBrokerProxy } from '../../brokers/directory/browse/directory-browse-broker.proxy';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;

export const useDirectoryBrowserBindingProxy = (): {
  setupEntries: (params: { entries: DirectoryEntry[] }) => void;
  setupError: () => void;
} => {
  const brokerProxy = directoryBrowseBrokerProxy();

  return {
    setupEntries: ({ entries }: { entries: DirectoryEntry[] }): void => {
      brokerProxy.setupEntries({ entries });
    },
    setupError: (): void => {
      brokerProxy.setupError();
    },
  };
};
