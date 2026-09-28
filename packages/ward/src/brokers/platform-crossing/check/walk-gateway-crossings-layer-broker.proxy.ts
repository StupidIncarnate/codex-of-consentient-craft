import type { FilePath } from '@dungeonmaster/shared/contracts';
import { resolveSpecifierCachedLayerBrokerProxy } from './resolve-specifier-cached-layer-broker.proxy';

export const walkGatewayCrossingsLayerBrokerProxy = (): {
  setupFile: (params: { filePath: FilePath; content: string }) => void;
  setupMissing: (params: { filePath: FilePath }) => void;
} => {
  const resolveProxy = resolveSpecifierCachedLayerBrokerProxy();

  return {
    setupFile: resolveProxy.setupFile,
    setupMissing: resolveProxy.setupMissing,
  };
};
