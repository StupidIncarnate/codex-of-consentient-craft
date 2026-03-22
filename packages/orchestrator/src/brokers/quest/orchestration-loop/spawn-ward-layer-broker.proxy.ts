import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';

export const spawnWardLayerBrokerProxy = (): {
  setupWardSuccess: (params: { exitCode: ExitCode; stdoutLines?: string[] }) => void;
  setupWardFailure: (params: { exitCode: ExitCode; stdoutLines?: string[] }) => void;
  setupWardNoRunId: () => void;
  setupWardKilled: () => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupWardSuccess: ({
      exitCode,
      stdoutLines,
    }: {
      exitCode: ExitCode;
      stdoutLines?: string[];
    }): void => {
      const lines = stdoutLines ?? ['run: 1739625600000-a3f1', 'lint:      PASS'];
      captureProxy.setupSuccess({
        exitCode,
        stdout: lines.join('\n'),
        stderr: '',
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
      captureProxy.setupSuccess({
        exitCode,
        stdout: lines.join('\n'),
        stderr: '',
      });
    },

    setupWardNoRunId: (): void => {
      captureProxy.setupError({ error: new Error('Process crashed') });
    },

    setupWardKilled: (): void => {
      captureProxy.setupError({ error: new Error('Process was killed') });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
  };
};
