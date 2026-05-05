import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import type { Dirent } from 'fs';

export const safeReaddirLayerBrokerProxy = (): {
  setupReaddirThrows: ({ error }: { error: Error }) => void;
  setupReaddirReturns: ({ entries }: { entries: Dirent[] }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  return {
    setupReaddirThrows: ({ error }: { error: Error }): void => {
      readdirProxy.throws({ error });
    },
    setupReaddirReturns: ({ entries }: { entries: Dirent[] }): void => {
      readdirProxy.returns({ entries });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.implementation({ fn });
    },
  };
};
