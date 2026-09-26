import type { FilePath } from '@dungeonmaster/shared/contracts';
import { resolveSpecifierCachedLayerBrokerProxy } from './resolve-specifier-cached-layer-broker.proxy';
import { typescriptModuleShapeAdapterProxy } from '../../../adapters/typescript/module-shape/typescript-module-shape-adapter.proxy';

export const walkGatewayCrossingsLayerBrokerProxy = (): {
  setupFile: (params: { filePath: FilePath; content: string }) => void;
  setupMissing: (params: { filePath: FilePath }) => void;
} => {
  const resolveProxy = resolveSpecifierCachedLayerBrokerProxy();
  // The real parser is exercised for real by every scenario in this file's own test — constructed
  // here only to satisfy enforce-proxy-child-creation.
  typescriptModuleShapeAdapterProxy();

  return {
    setupFile: resolveProxy.setupFile,
    setupMissing: resolveProxy.setupMissing,
  };
};
