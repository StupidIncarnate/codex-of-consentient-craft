import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { agentStreamMonitorBrokerProxy } from '../stream-monitor/agent-stream-monitor-broker.proxy';

export const agentSpawnByRoleBrokerProxy = (): {
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnFailure: () => void;
  setupSpawnFailureOnce: () => void;
} => {
  const monitorProxy = agentStreamMonitorBrokerProxy();
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();

  return {
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      // Use monitor proxy for readline line emission (shared readline mock)
      monitorProxy.setupStreamAndExit({ lines, exitCode });

      // Use spawn proxy so spawn() returns a mock ChildProcess
      // The spawn mock's process handles exit event scheduling via setupSuccess
      spawnProxy.setupSuccess({ exitCode });
    },

    setupSpawnFailure: (): void => {
      spawnProxy.setupSpawnThrow({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnFailureOnce: (): void => {
      spawnProxy.setupSpawnThrowOnce({ error: new Error('spawn claude ENOENT') });
    },
  };
};
