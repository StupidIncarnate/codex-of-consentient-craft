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

// git-detect-default-branch spawns bare `git` for every rev-parse check, so `command` alone cannot
// tell the (up to two) sequential calls apart — every call shares the identical address, and the
// shared childProcessSpawnCaptureAdapterProxy only exposes sticky calledWith staging (the LAST
// staging wins for every matching call, not the call that happens first in real time). onceFor's
// FIFO consumption is what "identical calls must get different results" needs, so this proxy mocks
// `spawn` directly instead of composing the shared proxy.
const createGitChild = ({
  exitCode,
  stderr,
}: {
  exitCode: ExitCode;
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

  const mockStderr = child.stderr;

  setImmediate(() => {
    if (String(stderr).length > 0) {
      mockStderr.push(Buffer.from(String(stderr)));
    }
    mockStderr.push(null);
    child.stdout?.push(null);
    child.emit('exit', Number(exitCode), null);
  });

  return child;
};

export const gitDetectDefaultBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes childProcessSpawnCaptureAdapter, but
  // this proxy answers `spawn` directly (see the module comment above) so the shared proxy's own
  // constructor-level default never fires.
  childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  const fatalMessage = ErrorMessageStub({ value: 'fatal: not a valid ref' });

  return {
    setupMainExists: (): void => {
      handle
        .onceFor(['git'])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
    },

    setupMasterExists: (): void => {
      handle
        .onceFor(['git'])
        .implement(() => createGitChild({ exitCode: failCode, stderr: fatalMessage }));
      handle
        .onceFor(['git'])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
    },

    setupNeitherExists: (): void => {
      handle
        .onceFor(['git'])
        .implement(() => createGitChild({ exitCode: failCode, stderr: fatalMessage }));
      handle
        .onceFor(['git'])
        .implement(() => createGitChild({ exitCode: failCode, stderr: fatalMessage }));
    },
  };
};
