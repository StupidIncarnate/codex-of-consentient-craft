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

// The `git diff` and the `git ls-files` are both spawned as bare `git`, so `command` alone cannot
// tell them apart. This proxy mocks `spawn` directly with onceFor (instead of composing the shared
// childProcessSpawnCaptureAdapterProxy, which only exposes sticky calledWith staging), staging each
// call in the same order the broker issues them. The broker awaits them through Promise.all, but
// the array literal evaluates left to right, so the diff is still spawned before the ls-files.
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

export const gitDiffUncommittedBrokerProxy = (): {
  setupWorkingTree: (params: { trackedOutput: string; untrackedOutput: string }) => void;
  getSpawnedArgs: () => unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes childProcessSpawnCaptureAdapter, but this
  // proxy answers `spawn` directly (see the module comment above) so the shared proxy's own
  // constructor-level default never fires.
  childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupWorkingTree: ({
      trackedOutput,
      untrackedOutput,
    }: {
      trackedOutput: string;
      untrackedOutput: string;
    }): void => {
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: trackedOutput }),
          stderr: emptyMessage,
        }),
      );
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: untrackedOutput }),
          stderr: emptyMessage,
        }),
      );
    },

    getSpawnedArgs: (): unknown[] =>
      handle.callsMatching(['git']).map((call) => (Array.isArray(call) ? call[1] : undefined)),
  };
};
