import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentSpawnStreamingBrokerProxy } from '../../agent/spawn-streaming/agent-spawn-streaming-broker.proxy';
import type { StreamJsonLine } from '../../../contracts/stream-json-line/stream-json-line-contract';

export const spiritmenderSpawnStreamingBrokerProxy = (): {
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
  const agentProxy = agentSpawnStreamingBrokerProxy();

  return {
    setupSuccessWithSignal: ({
      exitCode,
      lines,
    }: {
      exitCode: ExitCode;
      lines: readonly StreamJsonLine[];
    }): void => {
      agentProxy.setupSuccessWithSignal({ exitCode, lines });
    },

    setupSuccessNoSignal: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentProxy.setupSuccessNoSignal({ exitCode });
    },

    setupCrash: ({ exitCode }: { exitCode: ExitCode }): void => {
      agentProxy.setupCrash({ exitCode });
    },

    setupTimeout: ({ exitCode }: { exitCode: ExitCode | null }): void => {
      agentProxy.setupTimeout({ exitCode });
    },

    setupError: ({ error }: { error: Error }): void => {
      agentProxy.setupError({ error });
    },

    getSpawnedArgs: (): unknown => agentProxy.getSpawnedArgs(),
  };
};
