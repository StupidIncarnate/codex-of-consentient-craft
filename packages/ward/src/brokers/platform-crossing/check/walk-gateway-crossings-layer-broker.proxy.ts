import { resolveSpecifierCachedLayerBrokerProxy } from './resolve-specifier-cached-layer-broker.proxy';

export const walkGatewayCrossingsLayerBrokerProxy = (): {
  setupFile: (params: { filePath: string; content: string }) => void;
  setupMissing: (params: { filePath: string }) => void;
} => {
  const resolveProxy = resolveSpecifierCachedLayerBrokerProxy();

  return {
    setupFile: resolveProxy.setupFile,
    setupMissing: resolveProxy.setupMissing,
  };
};
