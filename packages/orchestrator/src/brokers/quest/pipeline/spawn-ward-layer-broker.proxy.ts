import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';

export const spawnWardLayerBrokerProxy = (): {
  setupWardSuccess: (params: { exitCode: ExitCode }) => void;
  setupWardFailure: (params: { exitCode: ExitCode; output: string }) => void;
  setupWardError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupWardSuccess: ({ exitCode }: { exitCode: ExitCode }): void => {
      captureProxy.setupSuccess({ exitCode, stdout: '', stderr: '' });
    },

    setupWardFailure: ({ exitCode, output }: { exitCode: ExitCode; output: string }): void => {
      captureProxy.setupSuccess({ exitCode, stdout: output, stderr: '' });
    },

    setupWardError: ({ error }: { error: Error }): void => {
      captureProxy.setupError({ error });
    },

    getSpawnedCommand: (): unknown => captureProxy.getSpawnedCommand(),

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),

    getSpawnedCwd: (): unknown => captureProxy.getSpawnedCwd(),
  };
};
