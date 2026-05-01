import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';

export const discoverPackagesLayerBrokerProxy = (): {
  setupPackages: ({ entries }: { entries: Dirent[] }) => void;
  setupMissingPackagesDir: () => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupPackages: ({ entries }: { entries: Dirent[] }): void => {
      fsProxy.returns({ entries });
    },

    setupMissingPackagesDir: (): void => {
      fsProxy.throws({ error: new Error('ENOENT') });
    },
  };
};
