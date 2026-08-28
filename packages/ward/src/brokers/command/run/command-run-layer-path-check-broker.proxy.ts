import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const commandRunLayerPathCheckBrokerProxy = (): {
  setupExistingPath: ({ filePath }: { filePath: FilePath }) => void;
  setupMissingPath: ({ filePath }: { filePath: FilePath }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();

  // NO CATCH-ALL HERE, deliberately. A constructor-level `calledWith([])` would sit at the same low
  // specificity as the shared adapter proxy's own `false` default, and whichever proxy the parent
  // happens to construct LAST would silently win everywhere — an order-dependency the address-based
  // mocking exists to remove. Both methods below address the ABSOLUTE path, which is what the broker
  // builds from `rootPath` plus the repo-relative arg, so two tests naming different paths cannot
  // collide.
  return {
    setupExistingPath: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ filePath, result: true });
    },
    setupMissingPath: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ filePath, result: false });
    },
  };
};
