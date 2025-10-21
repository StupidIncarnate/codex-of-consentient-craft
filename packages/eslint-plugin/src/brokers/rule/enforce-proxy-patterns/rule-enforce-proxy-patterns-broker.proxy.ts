import type { PathLike } from 'fs';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

export const ruleEnforceProxyPatternsBrokerProxy = (): {
  setupFileSystem: (fileSystemCheck: (path: PathLike) => boolean) => void;
} => {
  const adapterProxy = fsExistsSyncAdapterProxy();

  return {
    setupFileSystem: (fileSystemCheck: (path: PathLike) => boolean): void => {
      adapterProxy.setupFileSystem(fileSystemCheck);
    },
  };
};
