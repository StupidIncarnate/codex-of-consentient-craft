import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// gitHeadShaAdapter always spawns bare `git`, matching the command childProcessSpawnCaptureAdapter
// is invoked with, so the underlying spawn mock's command-addressed staging matches. There is only
// ONE call per adapter invocation (`git rev-parse HEAD`), so — unlike the ward package's
// multi-call git brokers — composing the shared childProcessSpawnCaptureAdapterProxy directly is
// enough; no raw `spawn` mocking or onceFor sequencing is needed.
const GIT_COMMAND = 'git';

export const gitHeadShaAdapterProxy = (): {
  setupSuccess: (params: { sha: string }) => void;
  setupFailure: () => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 128 });

  return {
    setupSuccess: ({ sha }: { sha: string }): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: `${sha}\n` }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupFailure: (): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({ value: 'fatal: not a git repository' }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs({ command: GIT_COMMAND }),
  };
};
