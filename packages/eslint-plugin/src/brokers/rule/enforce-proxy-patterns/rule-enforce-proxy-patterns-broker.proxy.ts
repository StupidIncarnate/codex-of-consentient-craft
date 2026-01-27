import type { PathLike } from 'fs';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { validateProxyFunctionReturnLayerBrokerProxy } from './validate-proxy-function-return-layer-broker.proxy';
import { validateAdapterMockSetupLayerBrokerProxy } from './validate-adapter-mock-setup-layer-broker.proxy';
import { validateProxyConstructorSideEffectsLayerBrokerProxy } from './validate-proxy-constructor-side-effects-layer-broker.proxy';
import { validateNoExposedChildProxiesLayerBrokerProxy } from './validate-no-exposed-child-proxies-layer-broker.proxy';

export const ruleEnforceProxyPatternsBrokerProxy = (): {
  setupFileSystem: (fileSystemCheck: (path: PathLike) => boolean) => void;
} => {
  const adapterProxy = fsExistsSyncAdapterProxy();
  validateProxyFunctionReturnLayerBrokerProxy();
  validateAdapterMockSetupLayerBrokerProxy();
  validateProxyConstructorSideEffectsLayerBrokerProxy();
  validateNoExposedChildProxiesLayerBrokerProxy();

  return {
    setupFileSystem: (fileSystemCheck: (path: PathLike) => boolean): void => {
      adapterProxy.setupFileSystem(fileSystemCheck);
    },
  };
};
