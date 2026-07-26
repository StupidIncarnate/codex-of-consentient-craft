import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const readPackageJsonSafeLayerBrokerProxy = (): {
  returns: (params: { pkgJsonPath: FilePath; content: string }) => void;
  throws: (params: { pkgJsonPath: FilePath; error: Error }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();

  return {
    returns: ({ pkgJsonPath, content }: { pkgJsonPath: FilePath; content: string }): void => {
      readProxy.returns({ filePath: pkgJsonPath, content });
    },
    throws: ({ pkgJsonPath, error }: { pkgJsonPath: FilePath; error: Error }): void => {
      readProxy.throws({ filePath: pkgJsonPath, error });
    },
  };
};
