/**
 * PURPOSE: Proxy for resolveStaticStringLayerBroker
 *
 * USAGE:
 * const proxy = resolveStaticStringLayerBrokerProxy();
 * proxy.setupImportedFile({ path, contents }); // the statics file an imported object lives in
 *
 * WHEN-TO-USE: Composes findModuleConstInitLayerBrokerProxy and resolveImportedStaticsLayerBrokerProxy
 * (enforce-proxy-child-creation) — the layer itself is a pure AST walk; the only I/O boundary is the
 * statics file the imported-statics layer reads, staged through `setupImportedFile`.
 */
import { findModuleConstInitLayerBrokerProxy } from './find-module-const-init-layer-broker.proxy';
import { resolveImportedStaticsLayerBrokerProxy } from './resolve-imported-statics-layer-broker.proxy';

export const resolveStaticStringLayerBrokerProxy = (): {
  setupImportedFile: (args: { path: string; contents: string }) => void;
} => {
  findModuleConstInitLayerBrokerProxy();
  const importedProxy = resolveImportedStaticsLayerBrokerProxy();

  return {
    setupImportedFile: ({ path, contents }: { path: string; contents: string }): void => {
      importedProxy.setupFile({ path, contents });
    },
  };
};
