/**
 * PURPOSE: Proxy for resolveImportedStaticsLayerBroker — stages the statics file it reads.
 *
 * USAGE:
 * const proxy = resolveImportedStaticsLayerBrokerProxy();
 * proxy.setupFile({ path: '/repo/packages/ward/src/statics/bundle/bundle-statics.ts', contents: "export const bundleStatics = { buildCommand: 'npm' } as const;" });
 * proxy.setupMissing({ path: '/repo/packages/ward/src/statics/bundle/bundle-statics.ts' });
 */
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';

export const resolveImportedStaticsLayerBrokerProxy = (): {
  setupFile: (args: { path: string; contents: string }) => void;
  setupMissing: (args: { path: string }) => void;
} => {
  const readProxy = readFileSyncIfExistsProxy();

  return {
    setupFile: ({ path, contents }: { path: string; contents: string }): void => {
      readProxy.returns({ path, contents });
    },
    setupMissing: ({ path }: { path: string }): void => {
      readProxy.missing({ path });
    },
  };
};
