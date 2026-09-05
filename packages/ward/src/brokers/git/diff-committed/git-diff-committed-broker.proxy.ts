import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitDetectDefaultBranchBrokerProxy } from '../detect-default-branch/git-detect-default-branch-broker.proxy';

// merge-base and diff are both spawned as bare `git`, exactly like the sequential rev-parse checks
// in gitDetectDefaultBranchBrokerProxy — `command` alone cannot tell them apart. This proxy also
// mocks `spawn` directly with onceFor (instead of composing the shared
// childProcessSpawnCaptureAdapterProxy, which only exposes sticky calledWith staging), staging each
// call in the same order the broker actually issues them.
const createGitChild = ({
  exitCode,
  stdout,
  stderr,
}: {
  exitCode: ExitCode;
  stdout: ErrorMessage;
  stderr: ErrorMessage;
}): ChildProcess => {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });

  const mockStdout = child.stdout;
  const mockStderr = child.stderr;

  setImmediate(() => {
    if (String(stdout).length > 0) {
      mockStdout.push(Buffer.from(String(stdout)));
    }
    mockStdout.push(null);
    if (String(stderr).length > 0) {
      mockStderr.push(Buffer.from(String(stderr)));
    }
    mockStderr.push(null);
    child.emit('exit', Number(exitCode), null);
  });

  return child;
};

export const gitDiffFilesBrokerProxy = (): {
  setupWithMainBranch: (params: { diffOutput: string }) => void;
  setupWithMasterBranch: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: (params: { diffOutput: string }) => void;
  setupNoBranch: (params: { diffOutput: string }) => void;
  getDiffArgs: () => unknown;
} => {
  const detectProxy = gitDetectDefaultBranchBrokerProxy();
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes childProcessSpawnCaptureAdapter, but
  // this proxy answers `spawn` directly (see the module comment above) so the shared proxy's own
  // constructor-level default never fires.
  childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupWithMainBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMainExists();
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: 'abc123\n' }),
          stderr: emptyMessage,
        }),
      );
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: diffOutput }),
          stderr: emptyMessage,
        }),
      );
    },

    setupWithMasterBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMasterExists();
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: 'abc123\n' }),
          stderr: emptyMessage,
        }),
      );
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: diffOutput }),
          stderr: emptyMessage,
        }),
      );
    },

    setupMergeBaseFails: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupMainExists();
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: failCode,
          stdout: emptyMessage,
          stderr: ErrorMessageStub({ value: 'fatal' }),
        }),
      );
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: diffOutput }),
          stderr: emptyMessage,
        }),
      );
    },

    setupNoBranch: ({ diffOutput }: { diffOutput: string }): void => {
      detectProxy.setupNeitherExists();
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: diffOutput }),
          stderr: emptyMessage,
        }),
      );
    },

    getDiffArgs: (): unknown => {
      const calls = handle.callsMatching(['git']);
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      return lastCall[1];
    },
  };
};
