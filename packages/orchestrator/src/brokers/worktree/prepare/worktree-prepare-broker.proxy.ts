import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  ErrorMessageStub,
  ExitCodeStub,
  type AbsoluteFilePath,
  type BaseBranchName,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitHeadShaAdapterProxy } from '../../../adapters/git/head-sha/git-head-sha-adapter.proxy';
import { gitVerifyRefAdapterProxy } from '../../../adapters/git/verify-ref/git-verify-ref-adapter.proxy';
import { gitWorktreeAddAdapterProxy } from '../../../adapters/git/worktree-add/git-worktree-add-adapter.proxy';
import { gitWorktreePruneAdapterProxy } from '../../../adapters/git/worktree-prune/git-worktree-prune-adapter.proxy';
import { worktreeDiscardBrokerProxy } from '../discard/worktree-discard-broker.proxy';

// worktreePrepareBroker spawns bare `git` for FOUR distinct invocations — `worktree add`,
// `rev-parse HEAD`, and, on a discard path, `worktree remove` + `branch -D` — so `command` alone
// cannot tell them apart under the shared childProcessSpawnCaptureAdapterProxy's command-only
// addressing (composing all four adapters' own `.proxy.ts` files in one test would make the LAST
// registration answer every call). Addressing on the full args array instead discriminates every
// call directly (args compare elementwise), so every outcome can be staged independently with no
// onceFor/FIFO sequencing needed. Pattern verified in git-detect-base-branch-broker.proxy.ts.
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

export const worktreePrepareBrokerProxy = (): {
  setupHappyPath: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
    sha: string;
  }) => void;
  setupAttachExistingBranch: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    sha: string;
  }) => void;
  setupAttachExistingBranchHeadShaFails: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
  }) => void;
  setupWorktreeAddFails: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
    output: string;
  }) => void;
  setupHeadShaFailsDiscardSucceeds: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
  }) => void;
  setupHeadShaFailsDiscardAlsoFails: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
    removeFailureOutput: string;
  }) => void;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged to satisfy enforce-proxy-child-creation: this proxy answers `spawn`
  // directly for every git call (see module comment above), so these adapter/broker proxies' own
  // constructor-level defaults never fire.
  gitWorktreeAddAdapterProxy();
  gitWorktreePruneAdapterProxy();
  gitVerifyRefAdapterProxy();
  gitHeadShaAdapterProxy();
  worktreeDiscardBrokerProxy();

  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 128 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  // The create-vs-attach mode probe. Staged per scenario rather than once in the constructor: a
  // nested args ARRAY compares elementwise in full (the prefix rule applies to the argument LIST,
  // not inside it), so `['rev-parse', '--verify']` matches no real 3-element call and the ref has to
  // be named — which is only knowable once a setup method hands its branchName over.
  const stageBranchMissing = ({ branchName }: { branchName: QuestBranchName }): void => {
    handle.calledWith(['git', ['rev-parse', '--verify', branchName]]).implement(() =>
      createGitChild({
        exitCode: failCode,
        stderr: ErrorMessageStub({ value: 'fatal: Needed a single revision' }),
      }),
    );
  };

  const stageBranchExists = ({ branchName }: { branchName: QuestBranchName }): void => {
    handle
      .calledWith(['git', ['rev-parse', '--verify', branchName]])
      .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
    handle
      .calledWith(['git', ['worktree', 'prune']])
      .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
  };

  const stageAddSucceeds = ({
    worktreePath,
    branchName,
    baseBranch,
  }: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
  }): void => {
    stageBranchMissing({ branchName });
    handle
      .calledWith(['git', ['worktree', 'add', worktreePath, '-b', branchName, baseBranch]])
      .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
  };

  const stageHeadShaFails = (): void => {
    handle.calledWith(['git', ['rev-parse', 'HEAD']]).implement(() =>
      createGitChild({
        exitCode: failCode,
        stderr: ErrorMessageStub({ value: 'fatal: not a git repository' }),
      }),
    );
  };

  return {
    setupHappyPath: ({ worktreePath, branchName, baseBranch, sha }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      handle.calledWith(['git', ['rev-parse', 'HEAD']]).implement(() =>
        createGitChild({
          exitCode: successCode,
          stderr: ErrorMessageStub({ value: `${sha}\n` }),
        }),
      );
    },

    // The recoverable re-carve: the branch already resolves, so the broker prunes git's stale
    // registration and attaches WITHOUT `-b`.
    setupAttachExistingBranch: ({ worktreePath, branchName, sha }): void => {
      stageBranchExists({ branchName });
      handle
        .calledWith(['git', ['worktree', 'add', worktreePath, branchName]])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
      handle.calledWith(['git', ['rev-parse', 'HEAD']]).implement(() =>
        createGitChild({
          exitCode: successCode,
          stderr: ErrorMessageStub({ value: `${sha}\n` }),
        }),
      );
    },

    setupAttachExistingBranchHeadShaFails: ({ worktreePath, branchName }): void => {
      stageBranchExists({ branchName });
      handle
        .calledWith(['git', ['worktree', 'add', worktreePath, branchName]])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
      stageHeadShaFails();
    },

    setupWorktreeAddFails: ({ worktreePath, branchName, baseBranch, output }): void => {
      stageBranchMissing({ branchName });
      handle
        .calledWith(['git', ['worktree', 'add', worktreePath, '-b', branchName, baseBranch]])
        .implement(() =>
          createGitChild({ exitCode: failCode, stderr: ErrorMessageStub({ value: output }) }),
        );
    },

    setupHeadShaFailsDiscardSucceeds: ({ worktreePath, branchName, baseBranch }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaFails();
      handle
        .calledWith(['git', ['worktree', 'remove', '--force', worktreePath]])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
      handle
        .calledWith(['git', ['branch', '-D', branchName]])
        .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
    },

    setupHeadShaFailsDiscardAlsoFails: ({
      worktreePath,
      branchName,
      baseBranch,
      removeFailureOutput,
    }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaFails();
      handle.calledWith(['git', ['worktree', 'remove', '--force', worktreePath]]).implement(() =>
        createGitChild({
          exitCode: failCode,
          stderr: ErrorMessageStub({ value: removeFailureOutput }),
        }),
      );
    },

    getSpawnedArgsList: (): readonly unknown[] =>
      handle.callsMatching(['git']).map((call) => call[1]),
  };
};
