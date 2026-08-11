import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// gitVerifyRefAdapter always spawns bare `git`, matching the command childProcessSpawnCaptureAdapter
// is invoked with, so the underlying spawn mock's command-addressed staging matches. There is only
// ONE call per adapter invocation (`git rev-parse --verify <ref>`), so composing the shared
// childProcessSpawnCaptureAdapterProxy directly is enough; no raw `spawn` mocking or onceFor
// sequencing is needed.
const GIT_COMMAND = 'git';

export const gitVerifyRefAdapterProxy = (): {
  setupExists: () => void;
  setupMissing: () => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    setupExists: (): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupMissing: (): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: ExitCodeStub({ value: 128 }),
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: 'fatal: Needed a single revision' }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs({ command: GIT_COMMAND }),

    getSpawnedCwd: (): unknown => captureProxy.getSpawnedCwd({ command: GIT_COMMAND }),
  };
};
