import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';

/**
 * Proxy for gateway-layout rule broker. Stages a gateway subpath folder's own siblings.
 * `isGatewayFileGuard` is a pure guard and needs no proxy of its own.
 */
export const ruleGatewayLayoutBrokerProxy = (): {
  fsReaddirSync: ReturnType<typeof readdirEntriesSyncProxy>;
} => ({
  fsReaddirSync: readdirEntriesSyncProxy(),
});
