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

// Both rev-parse calls this broker issues are spawned as bare `git`, so `command` alone cannot tell
// them apart — they share one address. The shared childProcessSpawnCaptureAdapterProxy only exposes
// sticky calledWith staging, where the LAST staging answers every matching call; onceFor's FIFO
// consumption is what "identical calls must get different results" needs, so this proxy mocks
// `spawn` directly and stages each call in the order the broker issues them.
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

export const gitDetectOriginDefaultBranchBrokerProxy = (): {
  setupOriginMainExists: () => void;
  setupOriginMasterExists: () => void;
  setupNoOriginRefs: () => void;
  getSpawnedArgs: () => unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes childProcessSpawnCaptureAdapter, but this
  // proxy answers `spawn` directly (see the module comment above) so the shared proxy's own
  // constructor-level default never fires.
  childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  const fatalMessage = ErrorMessageStub({ value: 'fatal: Needed a single revision' });

  return {
    setupOriginMainExists: (): void => {
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: 'abc123\n' }),
          stderr: emptyMessage,
        }),
      );
    },

    setupOriginMasterExists: (): void => {
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: failCode,
          stdout: emptyMessage,
          stderr: fatalMessage,
        }),
      );
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: successCode,
          stdout: ErrorMessageStub({ value: 'def456\n' }),
          stderr: emptyMessage,
        }),
      );
    },

    setupNoOriginRefs: (): void => {
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: failCode,
          stdout: emptyMessage,
          stderr: fatalMessage,
        }),
      );
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: failCode,
          stdout: emptyMessage,
          stderr: fatalMessage,
        }),
      );
    },

    getSpawnedArgs: (): unknown[] =>
      handle.callsMatching(['git']).map((call) => (Array.isArray(call) ? call[1] : undefined)),
  };
};
