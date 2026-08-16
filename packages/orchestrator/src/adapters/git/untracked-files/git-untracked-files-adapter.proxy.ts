import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

const GIT_COMMAND = 'git';

export const gitUntrackedFilesAdapterProxy = (): {
  setupUntrackedOutput: (params: { output: string }) => void;
  setupFailure: (params: { output: string }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupUntrackedOutput: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: output }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupFailure: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: ExitCodeStub({ value: 128 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: output }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs({ command: GIT_COMMAND }),

    getSpawnedCwd: (): unknown => captureProxy.getSpawnedCwd({ command: GIT_COMMAND }),
  };
};
