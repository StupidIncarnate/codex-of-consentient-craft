import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// Exactly one call per invocation, always bare `npm`, so the shared command-addressed staging is
// enough — no raw `spawn` mocking and no onceFor sequencing.
const NPM_COMMAND = 'npm';

export const npmRunBuildAdapterProxy = (): {
  setupSuccess: () => void;
  setupFailure: (params: { output: string }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupSuccess: (): void => {
      captureProxy.setupSuccess({
        command: NPM_COMMAND,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupFailure: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({
        command: NPM_COMMAND,
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: output }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs({ command: NPM_COMMAND }),

    getSpawnedCwd: (): unknown => captureProxy.getSpawnedCwd({ command: NPM_COMMAND }),
  };
};
