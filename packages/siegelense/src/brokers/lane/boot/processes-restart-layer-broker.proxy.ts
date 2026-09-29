// PURPOSE: Proxy for processes-restart-layer-broker — stages the respawn's spawns and ready URLs
// and the registry row the new pgids are stamped on.
// USAGE: const proxy = processesRestartLayerBrokerProxy(); proxy.setupSpawn({ command, args, pid });

import { pgidsStampLayerBrokerProxy } from './pgids-stamp-layer-broker.proxy';
import { processesSpawnLayerBrokerProxy } from './processes-spawn-layer-broker.proxy';

export const processesRestartLayerBrokerProxy = (): {
  setupSpawn: (params: { command: string; args: readonly string[]; pid: number }) => void;
  setupReachable: (params: { url: string }) => void;
  setupUnreachable: (params: { url: string }) => void;
  setupDeadlineAlreadyPast: () => void;
  setupRegistry: (params: { json: string }) => void;
  getWrittenRegistry: () => unknown;
} => {
  const spawnProxy = processesSpawnLayerBrokerProxy();
  const stampProxy = pgidsStampLayerBrokerProxy();

  return {
    setupSpawn: ({
      command,
      args,
      pid,
    }: {
      command: string;
      args: readonly string[];
      pid: number;
    }): void => {
      spawnProxy.setupSpawn({ command, args, pid });
    },

    setupReachable: ({ url }: { url: string }): void => {
      spawnProxy.setupReachable({ url });
    },

    setupUnreachable: ({ url }: { url: string }): void => {
      spawnProxy.setupUnreachable({ url });
    },

    setupDeadlineAlreadyPast: (): void => {
      spawnProxy.setupDeadlineAlreadyPast();
    },

    setupRegistry: ({ json }: { json: string }): void => {
      stampProxy.setupRegistry({ json });
    },

    getWrittenRegistry: (): unknown => stampProxy.getWrittenContent(),
  };
};
