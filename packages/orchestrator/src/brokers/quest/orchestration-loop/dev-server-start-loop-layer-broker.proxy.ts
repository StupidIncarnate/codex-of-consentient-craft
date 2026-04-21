import type { ChildProcess } from 'child_process';

import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { devServerStartBrokerProxy } from '../../dev-server/start/dev-server-start-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const devServerStartLoopLayerBrokerProxy = (): {
  setupServerBecomesReady: () => ChildProcess;
  setupServerExitsBeforeReady: (params: { exitCode: number }) => void;
  setupServerReadinessTimeout: () => ChildProcess;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  getSpawnedArgs: () => unknown;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
} => {
  const serverProxy = devServerStartBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();
  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });

  return {
    setupServerBecomesReady: (): ChildProcess => serverProxy.setupServerBecomesReady(),

    setupServerExitsBeforeReady: ({ exitCode }: { exitCode: number }): void => {
      serverProxy.setupServerExitsBeforeReady({ exitCode });
    },

    setupServerReadinessTimeout: (): ChildProcess => serverProxy.setupServerReadinessTimeout(),

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

    setupStderrCapture: (): void => {
      stderrHandle.mockImplementation(() => true);
    },

    getStderrWrites: (): readonly unknown[] =>
      stderrHandle.mock.calls.map((call: readonly unknown[]) => call[0]),
  };
};
