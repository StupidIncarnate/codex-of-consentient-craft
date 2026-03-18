import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): {
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnceLazy: () => void;
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

    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnOnce({ lines, exitCode });
    },

    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      spawnProxy.setupSpawnAutoLines({ lines, exitCode });
    },

    setupSpawnOnceLazy: (): void => {
      spawnProxy.setupSpawnOnceLazy();
    },

    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },
  };
};
