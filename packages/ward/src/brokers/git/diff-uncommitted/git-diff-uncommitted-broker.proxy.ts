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

import { gitDetectUpstreamBrokerProxy } from '../detect-upstream/git-detect-upstream-broker.proxy';
import { gitDiffFilesBrokerProxy } from '../diff-files/git-diff-files-broker.proxy';

// merge-base and diff are both spawned as bare `git`, exactly like the sequential rev-parse checks
// this broker's upstream detection issues — `command` alone cannot tell them apart. This proxy mocks
// `spawn` directly with onceFor (instead of composing the shared childProcessSpawnCaptureAdapterProxy,
// which only exposes sticky calledWith staging), staging each call in the same order the broker
// actually issues them.
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

export const gitDiffUnpushedBrokerProxy = (): {
  setupWithTrackingBranch: (params: { upstreamRef: string; diffOutput: string }) => void;
  setupWithoutTrackingBranch: (params: { diffOutput: string }) => void;
  setupMergeBaseFails: (params: { diffOutput: string }) => void;
  setupNoOriginRefs: (params: { diffOutput: string }) => void;
  getDiffArgs: () => unknown;
} => {
  const upstreamProxy = gitDetectUpstreamBrokerProxy();
  const diffFilesProxy = gitDiffFilesBrokerProxy();
  const handle = registerMock({ fn: spawn });
  // Created but unstaged: the real implementation composes childProcessSpawnCaptureAdapter, but this
  // proxy answers `spawn` directly (see the module comment above) so the shared proxy's own
  // constructor-level default never fires.
  childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupWithTrackingBranch: ({
      upstreamRef,
      diffOutput,
    }: {
      upstreamRef: string;
      diffOutput: string;
    }): void => {
      upstreamProxy.setupTrackingBranch({ upstreamRef });
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

    setupWithoutTrackingBranch: ({ diffOutput }: { diffOutput: string }): void => {
      upstreamProxy.setupNoTrackingBranchOriginMainExists();
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

    // Upstream ref resolves, but HEAD and it share no history (an orphan or force-recreated branch),
    // so the broker drops to the local default-branch diff.
    setupMergeBaseFails: ({ diffOutput }: { diffOutput: string }): void => {
      upstreamProxy.setupTrackingBranch({ upstreamRef: 'origin/master' });
      handle.onceFor(['git']).implement(() =>
        createGitChild({
          exitCode: failCode,
          stdout: emptyMessage,
          stderr: ErrorMessageStub({ value: 'fatal: no merge base' }),
        }),
      );
      diffFilesProxy.setupWithMainBranch({ diffOutput });
    },

    setupNoOriginRefs: ({ diffOutput }: { diffOutput: string }): void => {
      upstreamProxy.setupNoOriginRefs();
      diffFilesProxy.setupWithMainBranch({ diffOutput });
    },

    getDiffArgs: (): unknown => {
      const calls = handle.callsMatching(['git']);
      const lastCall: unknown = calls[calls.length - 1];
      if (!Array.isArray(lastCall)) return undefined;
      return lastCall[1];
    },
  };
};
