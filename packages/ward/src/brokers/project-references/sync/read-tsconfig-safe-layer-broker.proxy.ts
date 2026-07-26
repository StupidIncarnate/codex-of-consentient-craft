import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadJsonSyncAdapterProxy } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter.proxy';

export const readTsconfigSafeLayerBrokerProxy = (): {
  returns: (params: { tsconfigPath: FilePath; content: string }) => void;
  throws: (params: { tsconfigPath: FilePath; error: Error }) => void;
} => {
  const jsonProxy = fsReadJsonSyncAdapterProxy();

  return {
    returns: ({ tsconfigPath, content }: { tsconfigPath: FilePath; content: string }): void => {
      jsonProxy.returns({ filePath: tsconfigPath, content });
    },
    throws: ({ tsconfigPath, error }: { tsconfigPath: FilePath; error: Error }): void => {
      jsonProxy.throws({ filePath: tsconfigPath, error });
    },
  };
};
