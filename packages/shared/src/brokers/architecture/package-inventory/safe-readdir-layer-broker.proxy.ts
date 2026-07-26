import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const safeReaddirLayerBrokerProxy = (): {
  setupDirectory: ({ dirPath, entries }: { dirPath: AbsoluteFilePath; entries: Dirent[] }) => void;
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupDirectory: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: Dirent[];
    }): void => {
      fsProxy.returns({ dirPath, entries });
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      fsProxy.throws({ dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
