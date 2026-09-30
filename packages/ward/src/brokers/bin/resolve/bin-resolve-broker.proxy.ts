
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { binWalkUpLayerBrokerProxy } from './bin-walk-up-layer-broker.proxy';

export const binResolveBrokerProxy = (): {
  setupFound: (params: { cwd: string; binName: BinCommand }) => BinCommand;
  setupNotFound: (params: { cwd: string; binName: BinCommand }) => void;
  setupFoundAt: (params: {
    cwd: string;
    binName: BinCommand;
    binDir: string;
    workspaceRoot: string | null;
  }) => BinCommand;
} => {
  const walkProxy = binWalkUpLayerBrokerProxy();

  return {
    // Returns the resolved command so composing proxies can address the downstream spawn call
    // with the same string binResolveBroker will actually produce.
    setupFound: ({ cwd, binName }: { cwd: string; binName: BinCommand }): BinCommand =>
      walkProxy.setupWalk({ dir: cwd, binName, binDir: cwd, workspaceRoot: null }),

    setupNotFound: ({ cwd, binName }: { cwd: string; binName: BinCommand }): void => {
      walkProxy.setupWalk({ dir: cwd, binName, binDir: null, workspaceRoot: null });
    },

    setupFoundAt: ({
      cwd,
      binName,
      binDir,
      workspaceRoot,
    }: {
      cwd: string;
      binName: BinCommand;
      binDir: string;
      workspaceRoot: string | null;
    }): BinCommand => walkProxy.setupWalk({ dir: cwd, binName, binDir, workspaceRoot }),
  };
};
