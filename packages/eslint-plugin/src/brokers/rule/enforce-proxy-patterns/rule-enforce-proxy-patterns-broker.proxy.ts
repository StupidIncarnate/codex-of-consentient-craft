import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { validateProxyFunctionReturnLayerBrokerProxy } from './validate-proxy-function-return-layer-broker.proxy';
import { validateAdapterMockSetupLayerBrokerProxy } from './validate-adapter-mock-setup-layer-broker.proxy';
import { validateProxyConstructorSideEffectsLayerBrokerProxy } from './validate-proxy-constructor-side-effects-layer-broker.proxy';
import { validateNoExposedChildProxiesLayerBrokerProxy } from './validate-no-exposed-child-proxies-layer-broker.proxy';

export const ruleEnforceProxyPatternsBrokerProxy = (): {
  setupFileSystem: (fileSystemCheck: (path: string) => boolean) => void;
} => {
  const existsProxy = existsSyncProxy();
  validateProxyFunctionReturnLayerBrokerProxy();
  validateAdapterMockSetupLayerBrokerProxy();
  validateProxyConstructorSideEffectsLayerBrokerProxy();
  validateNoExposedChildProxiesLayerBrokerProxy();

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
  };
};
