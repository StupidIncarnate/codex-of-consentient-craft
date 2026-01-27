import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { hookConfigDefaultBrokerProxy } from '../default/hook-config-default-broker.proxy';
import { hookConfigMergeBrokerProxy } from '../merge/hook-config-merge-broker.proxy';

export const hookConfigLoadBrokerProxy = (): {
  setupConfigPath: (params: { path: string }) => void;
  setupConfigExists: (params: { exists: boolean }) => void;
} => {
  const pathProxy = pathResolveAdapterProxy();
  const fsProxy = fsExistsSyncAdapterProxy();
  hookConfigDefaultBrokerProxy();
  hookConfigMergeBrokerProxy();

  return {
    setupConfigPath: ({ path }: { path: string }): void => {
      pathProxy.returns({ path });
    },
    setupConfigExists: ({ exists }: { exists: boolean }): void => {
      fsProxy.returns({ exists });
    },
  };
};
