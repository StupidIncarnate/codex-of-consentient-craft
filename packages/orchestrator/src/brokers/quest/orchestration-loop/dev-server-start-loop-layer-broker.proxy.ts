import type { ChildProcess } from 'child_process';

import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { devServerStartBrokerProxy } from '../../dev-server/start/dev-server-start-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const devServerStartLoopLayerBrokerProxy = (): {
  setupServerBecomesReady: () => ChildProcess;
  setupServerExitsBeforeReady: (params: { exitCode: number }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const serverProxy = devServerStartBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  return {
    setupServerBecomesReady: (): ChildProcess => serverProxy.setupServerBecomesReady(),

    setupServerExitsBeforeReady: ({ exitCode }: { exitCode: number }): void => {
      serverProxy.setupServerExitsBeforeReady({ exitCode });
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

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
