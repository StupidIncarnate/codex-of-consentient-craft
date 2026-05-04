import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';

export const listFlowFilesLayerBrokerProxy = (): {
  returns: ({ entries }: { entries: Dirent[] }) => void;
  implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();

  return {
    returns: ({ entries }: { entries: Dirent[] }): void => {
      readdirProxy.returns({ entries });
    },
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.implementation({ fn });
    },
  };
};
