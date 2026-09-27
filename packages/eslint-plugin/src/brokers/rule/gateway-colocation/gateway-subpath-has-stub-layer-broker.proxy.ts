import { fsReaddirSyncAdapterProxy } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter.proxy';

export const gatewaySubpathHasStubLayerBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof fsReaddirSyncAdapterProxy>;
} => ({
  fsReaddirSync: fsReaddirSyncAdapterProxy(),
});
