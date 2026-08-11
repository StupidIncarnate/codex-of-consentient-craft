import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// gitCurrentBranchAdapter always spawns bare `git`, matching the command childProcessSpawnCaptureAdapter
// is invoked with, so the underlying spawn mock's command-addressed staging matches. There is only
// ONE call per adapter invocation (`git rev-parse --abbrev-ref HEAD`), so composing the shared
// childProcessSpawnCaptureAdapterProxy directly is enough; no raw `spawn` mocking or onceFor
// sequencing is needed.
const GIT_COMMAND = 'git';

export const gitCurrentBranchAdapterProxy = (): {
  setupBranch: (params: { branchName: string }) => void;
  setupFailure: (params: { output: string }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();

  return {
    // stdout carries a trailing newline, matching real `git rev-parse` output — proves the adapter
    // trims it rather than handing the caller a dirty comparison value.
    setupBranch: ({ branchName }: { branchName: string }): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: `${branchName}\n` }),
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
