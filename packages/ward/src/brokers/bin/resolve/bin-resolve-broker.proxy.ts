
import { binWalkUpLayerBrokerProxy } from './bin-walk-up-layer-broker.proxy';

export const binResolveBrokerProxy = (): {
  setupFound: (params: { cwd: string; binName: string }) => string;
  setupNotFound: (params: { cwd: string; binName: string }) => void;
  setupFoundAt: (params: {
    cwd: string;
    binName: string;
    binDir: string;
    workspaceRoot: string | null;
  }) => string;
} => {
  const walkProxy = binWalkUpLayerBrokerProxy();

  return {
    // Returns the resolved command so composing proxies can address the downstream spawn call
    // with the same string binResolveBroker will actually produce.
    setupFound: ({ cwd, binName }: { cwd: string; binName: string }): string =>
      walkProxy.setupWalk({ dir: cwd, binName, binDir: cwd, workspaceRoot: null }),

    setupNotFound: ({ cwd, binName }: { cwd: string; binName: string }): void => {
      walkProxy.setupWalk({ dir: cwd, binName, binDir: null, workspaceRoot: null });
    },

    setupFoundAt: ({
      cwd,
      binName,
      binDir,
      workspaceRoot,
    }: {
      cwd: string;
      binName: string;
      binDir: string;
      workspaceRoot: string | null;
    }): string => walkProxy.setupWalk({ dir: cwd, binName, binDir, workspaceRoot }),
  };
};
