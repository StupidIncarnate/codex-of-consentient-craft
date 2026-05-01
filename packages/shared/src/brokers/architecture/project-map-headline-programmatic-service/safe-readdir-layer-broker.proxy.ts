import { fsReaddirWithTypesAdapterProxy } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter.proxy';
import type { Dirent } from 'fs';

export const safeReaddirLayerBrokerProxy = (): {
  returns: ({ entries }: { entries: Dirent[] }) => void;
  throws: ({ error }: { error: Error }) => void;
  implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const fsProxy = fsReaddirWithTypesAdapterProxy();

  return {
    returns: ({ entries }: { entries: Dirent[] }): void => {
      fsProxy.returns({ entries });
    },
    throws: ({ error }: { error: Error }): void => {
      fsProxy.throws({ error });
    },
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      fsProxy.implementation({ fn });
    },
  };
};
