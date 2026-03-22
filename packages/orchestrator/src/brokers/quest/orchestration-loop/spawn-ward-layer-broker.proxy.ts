import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamLinesAdapterProxy } from '@dungeonmaster/shared/testing';

export const spawnWardLayerBrokerProxy = (): {
  setupWardSuccess: (params: { exitCode: ExitCode; stdoutLines?: string[] }) => void;
  setupWardFailure: (params: { exitCode: ExitCode; stdoutLines?: string[] }) => void;
  setupWardNoRunId: () => void;
  setupWardKilled: () => void;
  getSpawnedArgs: () => unknown;
} => {
  const streamProxy = childProcessSpawnStreamLinesAdapterProxy();

  return {
    setupWardSuccess: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: string[];
    }): void => {
      const lines = stdoutLines ?? ['run: 1739625600000-a3f1', 'lint:      PASS'];
      streamProxy.setupSuccess({
        exitCode,
        stdoutLines: lines,
      });
    },

    setupWardFailure: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: string[];
    }): void => {
      const lines = stdoutLines ?? ['run: 1739625600000-a3f1', 'lint:      FAIL'];
      streamProxy.setupSuccess({
        exitCode,
        stdoutLines: lines,
      });
    },

    setupWardNoRunId: (): void => {
      streamProxy.setupError({ error: new Error('Process crashed') });
    },

    setupWardKilled: (): void => {
      streamProxy.setupError({ error: new Error('Process was killed') });
    },

    getSpawnedArgs: (): unknown => streamProxy.getSpawnedArgs(),
  };
};
