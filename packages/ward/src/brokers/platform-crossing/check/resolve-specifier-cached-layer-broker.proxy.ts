import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';

export const resolveSpecifierCachedLayerBrokerProxy = (): {
  setupFile: (params: { filePath: string; content: string }) => void;
  setupMissing: (params: { filePath: string }) => void;
} => {
  const resolveProxy = resolveSpecifierLayerBrokerProxy();

  return {
    setupFile: resolveProxy.setupFile,
    setupMissing: resolveProxy.setupMissing,
  };
};
