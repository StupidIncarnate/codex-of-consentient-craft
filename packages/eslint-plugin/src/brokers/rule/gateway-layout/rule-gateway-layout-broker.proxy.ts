import { fsReaddirSyncAdapterProxy } from '../../../adapters/fs/readdir-sync/fs-readdir-sync-adapter.proxy';

/**
 * Proxy for gateway-layout rule broker. Stages a gateway subpath folder's own siblings.
 * `isGatewayFileGuard` is a pure guard and needs no proxy of its own.
 */
export const ruleGatewayLayoutBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof fsReaddirSyncAdapterProxy>;
} => ({
  fsReaddirSync: fsReaddirSyncAdapterProxy(),
});
