import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { hookConfigDefaultBrokerProxy } from '../default/hook-config-default-broker.proxy';
import { hookConfigMergeBrokerProxy } from '../merge/hook-config-merge-broker.proxy';

export const hookConfigLoadBrokerProxy = (): {
  pathProxy: ReturnType<typeof pathResolveAdapterProxy>;
  fsProxy: ReturnType<typeof fsExistsSyncAdapterProxy>;
} => {
  const pathProxy = pathResolveAdapterProxy();
  const fsProxy = fsExistsSyncAdapterProxy();
  hookConfigDefaultBrokerProxy();
  hookConfigMergeBrokerProxy();

  return {
    pathProxy,
    fsProxy,
  };
};
