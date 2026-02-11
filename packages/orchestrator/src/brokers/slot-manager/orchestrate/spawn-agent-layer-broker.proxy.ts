import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): {
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
} => {
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnAndMonitor({ lines, exitCode });
    },

    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },
  };
};
