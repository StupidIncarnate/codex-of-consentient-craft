import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { gatewaySubpathHasStubLayerBrokerProxy } from './gateway-subpath-has-stub-layer-broker.proxy';

/**
 * Proxy for gateway-colocation rule broker. Stages which test/proxy companion paths exist, the
 * same way enforce-implementation-colocation's own proxy does — a general predicate over every
 * candidate path, since RuleTester cases carry many different filenames. `isGatewayFileGuard` is a
 * pure guard (no mocking, no proxy of its own). `gatewaySubpathDirectoryWalk` composes the layer
 * broker's own proxy for the `requireStub` option's recursive directory read.
 */
export const ruleGatewayColocationBrokerProxy = (): {
  fsExistsSync: ReturnType<typeof fsExistsSyncAdapterProxy>;
  gatewaySubpathDirectoryWalk: ReturnType<typeof gatewaySubpathHasStubLayerBrokerProxy>;
} => ({
  fsExistsSync: fsExistsSyncAdapterProxy(),
  gatewaySubpathDirectoryWalk: gatewaySubpathHasStubLayerBrokerProxy(),
});
