import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  ErrorMessageStub,
  ExitCodeStub,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitBranchDeleteAdapterProxy } from '../../../adapters/git/branch-delete/git-branch-delete-adapter.proxy';
import { gitWorktreeRemoveAdapterProxy } from '../../../adapters/git/worktree-remove/git-worktree-remove-adapter.proxy';

// worktreeDiscardBroker spawns bare `git` for BOTH `git worktree remove` and `git branch -D`, so
// `command` alone cannot tell the two calls apart under the shared childProcessSpawnCaptureAdapterProxy's
// command-only addressing — composing gitWorktreeRemoveAdapterProxy + gitBranchDeleteAdapterProxy
// directly in one test would make the LAST registration answer every call. Addressing on the full
// args array instead discriminates the two calls directly (args compare elementwise), so both
// outcomes can be staged independently with no onceFor/FIFO sequencing needed. Pattern verified in
// git-detect-base-branch-broker.proxy.ts.
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

export const worktreeDiscardBrokerProxy = (): {
  setupBothSucceed: () => void;
  setupRemoveFails: (params: { worktreePath: AbsoluteFilePath; output: string }) => void;
  setupDeleteFails: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    output: string;
  }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged to satisfy enforce-proxy-child-creation: this proxy answers `spawn`
  // directly for every git call (see module comment above), so these adapter proxies' own
  // constructor-level defaults never fire.
  gitWorktreeRemoveAdapterProxy();
  gitBranchDeleteAdapterProxy();

  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 128 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupBothSucceed: (): void => {
      handle
        .calledWith(['git'])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
    },

    setupRemoveFails: ({
      worktreePath,
      output,
    }: {
      worktreePath: AbsoluteFilePath;
      output: string;
    }): void => {
      handle
        .calledWith(['git', ['worktree', 'remove', '--force', worktreePath]])
        .implement(() =>
          createGitChild({ exitCode: failCode, stderr: ErrorMessageStub({ value: output }) }),
        );
    },

    setupDeleteFails: ({
      worktreePath,
      branchName,
      output,
    }: {
      worktreePath: AbsoluteFilePath;
      branchName: QuestBranchName;
      output: string;
    }): void => {
      handle
        .calledWith(['git', ['worktree', 'remove', '--force', worktreePath]])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
      handle
        .calledWith(['git', ['branch', '-D', branchName]])
        .implement(() =>
          createGitChild({ exitCode: failCode, stderr: ErrorMessageStub({ value: output }) }),
        );
    },

    getSpawnedArgsList: (): readonly unknown[] =>
      handle.callsMatching(['git']).map((call) => call[1]),
  };
};
