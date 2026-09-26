import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

/**
 * Proxy for gateway-colocation rule broker. Stages which test/proxy companion paths exist, the
 * same way enforce-implementation-colocation's own proxy does — a general predicate over every
 * candidate path, since RuleTester cases carry many different filenames. `isGatewayFileGuard` is a
 * pure guard (no mocking, no proxy of its own), so this is the implementation's only dependency.
 */
export const ruleGatewayColocationBrokerProxy = (): {
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
} => ({
  fsExistsSync: fsExistsSyncAdapterProxy(),
});
