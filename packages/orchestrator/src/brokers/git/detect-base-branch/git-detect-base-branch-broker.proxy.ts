import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  ErrorMessageStub,
  ExitCodeStub,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitVerifyRefAdapterProxy } from '../../../adapters/git/verify-ref/git-verify-ref-adapter.proxy';

// gitVerifyRefAdapter spawns bare `git` for both the main and master probes, so `command` alone
// cannot tell the two calls apart under the shared childProcessSpawnCaptureAdapterProxy's
// command-only addressing — that proxy's setupSuccess/setupMissing methods stage a SINGLE sticky
// answer per command, so calling both in one test collides. Addressing on the full args array
// instead — ['git', ['rev-parse', '--verify', 'main']] vs ['git', ['rev-parse', '--verify',
// 'master']] — discriminates the two calls directly (args compare elementwise, and a shorter
// description is a prefix match against the real 3-arg spawn call), so both outcomes can be
// staged independently in either order, with no onceFor/FIFO sequencing needed. Verified
// empirically: setupMasterExists below stages BOTH addresses up front and the broker still
// resolves 'master' correctly regardless of registration order.
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

export const gitDetectBaseBranchBrokerProxy = (): {
  setupMainExists: () => void;
  setupMasterExists: () => void;
  setupNeitherExists: () => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes gitVerifyRefAdapter (which itself
  // composes childProcessSpawnCaptureAdapter), but this proxy answers `spawn` directly (see the
  // module comment above) so the adapter proxy's own constructor-level default never fires.
  gitVerifyRefAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 128 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  const fatalMessage = ErrorMessageStub({ value: 'fatal: Needed a single revision' });

  const stageMain = ({ exists }: { exists: boolean }): void => {
    handle.calledWith(['git', ['rev-parse', '--verify', 'main']]).implement(() =>
      createGitChild({
        exitCode: exists ? successCode : failCode,
        stderr: exists ? emptyMessage : fatalMessage,
      }),
    );
  };

  const stageMaster = ({ exists }: { exists: boolean }): void => {
    handle.calledWith(['git', ['rev-parse', '--verify', 'master']]).implement(() =>
      createGitChild({
        exitCode: exists ? successCode : failCode,
        stderr: exists ? emptyMessage : fatalMessage,
      }),
    );
  };

  return {
    setupMainExists: (): void => {
      stageMain({ exists: true });
    },

    setupMasterExists: (): void => {
      stageMain({ exists: false });
      stageMaster({ exists: true });
    },

    setupNeitherExists: (): void => {
      stageMain({ exists: false });
      stageMaster({ exists: false });
    },

    getSpawnedArgsList: (): readonly unknown[] =>
      handle.callsMatching(['git']).map((call) => call[1]),
  };
};
