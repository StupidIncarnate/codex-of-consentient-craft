import { ErrorMessageStub, ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';

export const buildPreflightBrokerProxy = (): {
  setupBuildSuccess: (params: { command: string }) => void;
  setupBuildFailure: (params: { command: string; exitCode: ExitCode; output: string }) => void;
  setupBuildError: (params: { command: string; error: Error }) => void;
  getSpawnedCommand: (params: { command: string }) => unknown;
  getSpawnedArgs: (params: { command: string }) => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupBuildSuccess: ({ command }: { command: string }): void => {
      captureProxy.setupSuccess({
        command,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: 'Build succeeded' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupBuildFailure: ({
      command,
      exitCode,
      output,
    }: {
      command: string;
      exitCode: ExitCode;
      output: string;
    }): void => {
      captureProxy.setupSuccess({
        command,
        exitCode,
        stdout: ErrorMessageStub({ value: output }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupBuildError: ({ command, error }: { command: string; error: Error }): void => {
      captureProxy.setupError({ command, error });
    },

    getSpawnedCommand: ({ command }: { command: string }): unknown =>
      captureProxy.getSpawnedCommand({ command }),

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      captureProxy.getSpawnedArgs({ command }),
  };
};
