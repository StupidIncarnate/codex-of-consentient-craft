import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

// Mirrors gitHeadShaAdapterProxy: one `git` spawn per invocation (`git rev-parse @{upstream}`), so
// composing the shared childProcessSpawnCaptureAdapterProxy directly is enough — no raw spawn
// mocking and no onceFor sequencing.
const GIT_COMMAND = 'git';

export const gitUpstreamShaAdapterProxy = (): {
  setupSuccess: (params: { sha: string }) => void;
  setupNoUpstream: () => void;
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

    // What a branch that tracks nothing answers — the state a quest carved before riftcarver
    // started pushing is in, and the reason the caller has a `baseRef` fallback at all.
    setupNoUpstream: (): void => {
      captureProxy.setupSuccess({
        command: GIT_COMMAND,
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: '' }),
        stderr: ErrorMessageStub({
          value: "fatal: no upstream configured for branch 'quest/add-auth'",
        }),
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs({ command: GIT_COMMAND }),
  };
};
