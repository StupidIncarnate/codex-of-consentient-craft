import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const listFlowFilesLayerBrokerProxy = (): {
  returns: ({ dirPath, entries }: { dirPath: AbsoluteFilePath; entries: Dirent[] }) => void;
  implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();

  return {
    returns: ({ dirPath, entries }: { dirPath: AbsoluteFilePath; entries: Dirent[] }): void => {
      readdirProxy.returns({ dirPath, entries });
    },
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.implementation({ fn });
    },
  };
};
