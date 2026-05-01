import type { Dirent } from 'fs';
import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';

export const safeReaddirLayerBrokerProxy = (): {
  setupDirectory: ({ entries }: { entries: Dirent[] }) => void;
  setupError: ({ error }: { error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    setupDirectory: ({ entries }: { entries: Dirent[] }): void => {
      fsProxy.returns({ entries });
    },

    setupError: ({ error }: { error: Error }): void => {
      fsProxy.throws({ error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
