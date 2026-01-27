import type { ExitCode } from '@dungeonmaster/shared/contracts';
import { childProcessSpawnStreamJsonAdapterProxy } from '../../../adapters/child-process/spawn-stream-json/child-process-spawn-stream-json-adapter.proxy';
import { agentStreamMonitorBrokerProxy } from '../stream-monitor/agent-stream-monitor-broker.proxy';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';

export const agentSpawnStreamingBrokerProxy = (): {
  setupSuccessWithSignal: (params: {
    exitCode: ExitCode;
    lines: readonly StreamJsonLine[];
  }) => void;
  setupSuccessNoSignal: (params: { exitCode: ExitCode }) => void;
  setupCrash: (params: { exitCode: ExitCode }) => void;
  setupTimeout: (params: { exitCode: ExitCode | null }) => void;
  setupError: (params: { error: Error }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const spawnProxy = childProcessSpawnStreamJsonAdapterProxy();
  const monitorProxy = agentStreamMonitorBrokerProxy();

  return {
    setupSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      monitorProxy.setupStreamWithLines({ lines });
      spawnProxy.setupSuccess({ exitCode, stdoutData: lines });
    },

    setupSuccessNoSignal: ({ exitCode }: { exitCode: ExitCode }): void => {
      monitorProxy.setupEmptyStream();
      spawnProxy.setupSuccess({ exitCode });
    },

    setupCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      monitorProxy.setupEmptyStream();
      spawnProxy.setupSuccess({ exitCode });
    },

    setupTimeout: ({ exitCode }: { exitCode: ExitCode | null }): void => {
      monitorProxy.setupEmptyStream();
      monitorProxy.setupTimeoutFires();
      spawnProxy.setupExitOnKill({ exitCode });
    },

    setupError: ({ error }: { error: Error }): void => {
      spawnProxy.setupError({ error });
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
