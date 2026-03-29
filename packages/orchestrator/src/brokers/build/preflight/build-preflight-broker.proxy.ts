import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';

export const buildPreflightBrokerProxy = (): {
  setupBuildSuccess: () => void;
  setupBuildFailure: (params: { exitCode: ExitCode; output: string }) => void;
  setupBuildError: (params: { error: Error }) => void;
  getSpawnedCommand: () => unknown;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupBuildSuccess: (): void => {
      captureProxy.setupSuccess({
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: 'Build succeeded',
        stderr: '',
      });
    },

    setupBuildFailure: ({ exitCode, output }: { exitCode: ExitCode; output: string }): void => {
      captureProxy.setupSuccess({
        exitCode,
        stdout: output,
        stderr: '',
      });
    },

    setupBuildError: ({ error }: { error: Error }): void => {
      captureProxy.setupError({ error });
    },

    getSpawnedCommand: (): unknown => captureProxy.getSpawnedCommand(),

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
  };
};
