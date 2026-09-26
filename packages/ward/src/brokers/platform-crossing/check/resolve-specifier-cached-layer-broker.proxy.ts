import type { FilePath } from '@dungeonmaster/shared/contracts';
import { resolveSpecifierLayerBrokerProxy } from './resolve-specifier-layer-broker.proxy';

export const resolveSpecifierCachedLayerBrokerProxy = (): {
  setupFile: (params: { filePath: FilePath; content: string }) => void;
  setupMissing: (params: { filePath: FilePath }) => void;
} => {
  const resolveProxy = resolveSpecifierLayerBrokerProxy();

  return {
    setupFile: resolveProxy.setupFile,
    setupMissing: resolveProxy.setupMissing,
  };
};
