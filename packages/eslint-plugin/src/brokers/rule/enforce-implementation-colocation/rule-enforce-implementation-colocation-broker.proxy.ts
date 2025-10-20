import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

/**
 * Proxy for enforce-implementation-colocation rule broker.
 * Delegates to fsExistsSyncAdapter proxy for file system mocking.
 * Transformers don't need proxies per folderConfigStatics (requireProxy: false).
 */
export const ruleEnforceImplementationColocationBrokerProxy = (): {
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
} => ({
  fsExistsSync: fsExistsSyncAdapterProxy(),
});
