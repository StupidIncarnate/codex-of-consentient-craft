import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// gitPushAdapter always spawns bare `git`, and there is exactly ONE call per invocation, so the
// shared childProcessSpawnCaptureAdapterProxy's command-addressed staging is enough — no raw
// `spawn` mocking and no onceFor sequencing.
const GIT_COMMAND = 'git';

export const gitPushAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { output: string }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupSuccess: (): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: '' }),
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
