import { fsEnsureReadFileSyncAdapterProxy } from '../../../adapters/fs/ensure-read-file-sync/fs-ensure-read-file-sync-adapter.proxy';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const ruleEnforceProxyChildCreationBrokerProxy = (): {
  setupFileSystem: (args: { getContents: (filePath: FilePath) => FileContents | null }) => void;
} => {
  const adapterProxy = fsEnsureReadFileSyncAdapterProxy();

  return {
    setupFileSystem: ({
      getContents,
    }: {
      getContents: (filePath: FilePath) => FileContents | null;
    }): void => {
      adapterProxy.setupFileSystem({ getContents });
    },
  };
};
