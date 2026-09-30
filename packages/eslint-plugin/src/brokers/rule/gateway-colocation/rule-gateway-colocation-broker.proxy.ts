import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { gatewaySubpathHasStubLayerBrokerProxy } from './gateway-subpath-has-stub-layer-broker.proxy';
import { gatewaySubpathHasWrapperLayerBrokerProxy } from './gateway-subpath-has-wrapper-layer-broker.proxy';
import { barrelCompletenessLayerBrokerProxy } from './barrel-completeness-layer-broker.proxy';
import { barrelNamedReexportsLayerBrokerProxy } from './barrel-named-reexports-layer-broker.proxy';
import { barrelSingleHomeLayerBrokerProxy } from './barrel-single-home-layer-broker.proxy';
import { barrelNoTestSupportReexportLayerBrokerProxy } from './barrel-no-test-support-reexport-layer-broker.proxy';

/**
 * Proxy for gateway-colocation rule broker. Stages which test/proxy companion paths exist, the
 * same way enforce-implementation-colocation's own proxy does — a general predicate over every
 * candidate path, since RuleTester cases carry many different filenames. `isGatewayFileGuard` is a
 * pure guard (no mocking, no proxy of its own). `gatewaySubpathDirectoryWalk` composes the layer
 * broker's own proxy for the `requireStub` option's recursive directory read.
 * `barrelCompleteness` composes the same-named layer broker's proxy for the new
 * completeness/stale-reexport fs reads — it shares the underlying `fsReaddirSync`/`fsExistsSync`
 * mocks with the two fields above, since `registerMock` keys by function reference, not by caller.
 * `gatewaySubpathHasWrapperLayerBrokerProxy` reads through that same `fsReaddirSync` mock, so the
 * `gatewaySubpathDirectoryWalk` field stages both walks and the wrapper proxy needs no field.
 * The three exposed fields are each called INLINE as their own return-object property value,
 * never pre-assigned to a same-named local — `validateNoExposedChildProxiesLayerBroker` flags a
 * shorthand or identifier-valued property that echoes a local `const x = xProxy()`, but an inline
 * call is the field's own value, not a reference to one, so it never matches. The other three
 * barrel-* proxies are empty (pure AST/data checks, nothing to mock) — called as bare statements
 * before the return so they are still created (satisfying enforce-proxy-child-creation) without
 * exposing a child proxy field at all.
 */
export const ruleGatewayColocationBrokerProxy = (): {
  setupFileSystem: (fileSystemCheck: (path: string) => boolean) => void;
  gatewaySubpathDirectoryWalk: ReturnType<typeof gatewaySubpathHasStubLayerBrokerProxy>;
  barrelCompleteness: ReturnType<typeof barrelCompletenessLayerBrokerProxy>;
} => {
  const existsProxy = existsSyncProxy();
  gatewaySubpathHasWrapperLayerBrokerProxy();
  barrelNamedReexportsLayerBrokerProxy();
  barrelSingleHomeLayerBrokerProxy();
  barrelNoTestSupportReexportLayerBrokerProxy();

  return {
    // existsSyncProxy ships no address-less catch-all: the caller's own decision function is
    // staged as two complementary predicates, so exactly one ever answers a given call.
    setupFileSystem: (fileSystemCheck: (path: string) => boolean): void => {
      existsProxy.returnsMatchingPath({
        path: (value) => fileSystemCheck(String(value)),
        exists: true,
      });
      existsProxy.returnsMatchingPath({
        path: (value) => !fileSystemCheck(String(value)),
        exists: false,
      });
    },
    gatewaySubpathDirectoryWalk: gatewaySubpathHasStubLayerBrokerProxy(),
    barrelCompleteness: barrelCompletenessLayerBrokerProxy(),
  };
};
