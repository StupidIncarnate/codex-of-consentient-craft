import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const discoverPackagesLayerBrokerProxy = (): {
  setupPackages: ({ dirPath, entries }: { dirPath: AbsoluteFilePath; entries: Dirent[] }) => void;
  setupMissingPackagesDir: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupPackages: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: Dirent[];
    }): void => {
      fsProxy.returns({ dirPath, entries });
    },

    setupMissingPackagesDir: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      fsProxy.throws({ dirPath, error: new Error('ENOENT') });
    },
  };
};
