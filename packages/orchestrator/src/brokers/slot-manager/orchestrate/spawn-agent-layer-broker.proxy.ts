import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): {
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupAutoEmitLines: ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupAutoEmitLines'];
  setupSpawnFailure: () => void;
  setAutoReplayLines: (params: { lines: readonly string[] }) => void;
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

    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnOnce({ lines, exitCode });
    },

    setupAutoEmitLines: spawnProxy.setupAutoEmitLines,

    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },

    setAutoReplayLines: ({ lines }: { lines: readonly string[] }): void => {
      spawnProxy.setAutoReplayLines({ lines });
    },
  };
};
