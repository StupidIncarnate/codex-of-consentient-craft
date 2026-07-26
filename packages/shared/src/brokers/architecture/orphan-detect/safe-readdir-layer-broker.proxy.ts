import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import type { Dirent } from 'fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const safeReaddirLayerBrokerProxy = (): {
  setupReaddirThrows: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupReaddirReturns: ({
    dirPath,
    entries,
  }: {
    dirPath: AbsoluteFilePath;
    entries: Dirent[];
  }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  return {
    setupReaddirThrows: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      readdirProxy.throws({ dirPath, error });
    },
    setupReaddirReturns: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: Dirent[];
    }): void => {
      readdirProxy.returns({ dirPath, entries });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.implementation({ fn });
    },
  };
};
