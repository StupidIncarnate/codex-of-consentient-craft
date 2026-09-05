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
import { gitDetectOriginDefaultBranchBrokerProxy } from '../detect-origin-default-branch/git-detect-origin-default-branch-broker.proxy';

// merge-base and diff are both spawned as bare `git`, exactly like the sequential rev-parse checks
// the two detection brokers issue — `command` alone cannot tell them apart. This proxy mocks `spawn`
// directly with onceFor (instead of composing the shared childProcessSpawnCaptureAdapterProxy, which
// only exposes sticky calledWith staging), staging each call in the same order the broker issues
// them.
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

export const gitDiffCommittedBrokerProxy = (): {
  setupWithOriginMain: (params: { diffOutput: string }) => void;
  setupWithLocalFallback: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: () => void;
  setupNoBranchAnywhere: () => void;
  getSpawnedArgs: () => unknown[];
  getDiffArgs: () => unknown;
} => {
  const originProxy = gitDetectOriginDefaultBranchBrokerProxy();
  const localProxy = gitDetectDefaultBranchBrokerProxy();
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes childProcessSpawnCaptureAdapter, but this
  // proxy answers `spawn` directly (see the module comment above) so the shared proxy's own
  // constructor-level default never fires.
  childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  const stageMergeBaseThenDiff = ({ diffOutput }: { diffOutput: string }): void => {
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
  };

  return {
    setupWithOriginMain: ({ diffOutput }: { diffOutput: string }): void => {
      originProxy.setupOriginMainExists();
      stageMergeBaseThenDiff({ diffOutput });
    },

    // No origin refs at all (a fresh `git init`, an offline clone that has never fetched), so the
    // broker drops to the LOCAL default branch rather than answering with nothing.
    setupWithLocalFallback: ({ diffOutput }: { diffOutput: string }): void => {
      originProxy.setupNoOriginRefs();
      localProxy.setupMainExists();
      stageMergeBaseThenDiff({ diffOutput });
    },

    // The base ref resolves but shares no history with HEAD (an orphan or force-recreated branch),
    // so there is no range to diff and the broker reports nothing rather than guessing one.
    setupMergeBaseFails: (): void => {
      originProxy.setupOriginMainExists();
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: failCode,
          stdout: emptyMessage,
          stderr: ErrorMessageStub({ value: 'fatal: no merge base' }),
        }),
      );
    },

    setupNoBranchAnywhere: (): void => {
      originProxy.setupNoOriginRefs();
      localProxy.setupNeitherExists();
    },

    getSpawnedArgs: (): unknown[] =>
      handle.callsMatching(['git']).map((call) => (Array.isArray(call) ? call[1] : undefined)),

    getDiffArgs: (): unknown => {
      const calls = handle.callsMatching(['git']);
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      return lastCall[1];
    },
  };
};
