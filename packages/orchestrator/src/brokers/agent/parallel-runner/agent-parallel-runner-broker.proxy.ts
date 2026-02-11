import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../spawn-by-role/agent-spawn-by-role-broker.proxy';

export const agentParallelRunnerBrokerProxy = (): {
  setupAllSpawnsSucceed: (params: { exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
  setupMixedOutcomes: (params: { exitCode: ExitCode; leadingFailureCount: number }) => void;
} => {
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupAllSpawnsSucceed: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupSpawnAndMonitor({ lines: [], exitCode });
    },

    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnFailure();
    },

    setupMixedOutcomes: ({
      exitCode,
      leadingFailureCount,
    }: {
      exitCode: ExitCode;
      leadingFailureCount: number;
    }): void => {
      spawnProxy.setupSpawnAndMonitor({ lines: [], exitCode });
      Array.from({ length: leadingFailureCount }).forEach(() => {
        spawnProxy.setupSpawnFailureOnce();
      });
    },
  };
};
