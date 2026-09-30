import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const pathCheckLayerBrokerProxy = (): {
  setupExistingPath: ({ filePath }: { filePath: string }) => void;
  setupMissingPath: ({ filePath }: { filePath: string }) => void;
} => {
  const existsProxy = existsSyncProxy();

  // NO CATCH-ALL HERE, deliberately. A constructor-level `calledWith([])` would sit at the same low
  // specificity as another composing proxy's own catch-all on this SAME underlying fs.existsSync
  // mock, and whichever proxy the parent happens to construct LAST would silently win everywhere —
  // an order-dependency the address-based mocking exists to remove. Both methods below address the
  // ABSOLUTE path, which is what the broker builds from `rootPath` plus the repo-relative arg, so
  // two tests naming different paths cannot collide.
  return {
    setupExistingPath: ({ filePath }: { filePath: string }): void => {
      existsProxy.returns({ path: filePath, exists: true });
    },
    setupMissingPath: ({ filePath }: { filePath: string }): void => {
      existsProxy.returns({ path: filePath, exists: false });
    },
  };
};
