import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  ErrorMessageStub,
  ExitCodeStub,
  FilePathStub,
  type AbsoluteFilePath,
  type BaseBranchName,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { gitHeadShaAdapterProxy } from '../../../adapters/git/head-sha/git-head-sha-adapter.proxy';
import { gitWorktreeAddAdapterProxy } from '../../../adapters/git/worktree-add/git-worktree-add-adapter.proxy';
import { worktreeDiscardBrokerProxy } from '../discard/worktree-discard-broker.proxy';
import { worktreePopulateNodeModulesBrokerProxy } from '../populate-node-modules/worktree-populate-node-modules-broker.proxy';
import { buildUntilGreenLayerBrokerProxy } from './build-until-green-layer-broker.proxy';

// worktreePrepareBroker spawns bare `git` for FOUR distinct invocations — `worktree add`,
// `rev-parse HEAD`, and, on a discard path, `worktree remove` + `branch -D` — so `command` alone
// cannot tell them apart under the shared childProcessSpawnCaptureAdapterProxy's command-only
// addressing (composing all four adapters' own `.proxy.ts` files in one test would make the LAST
// registration answer every call). Addressing on the full args array instead discriminates every
// call directly (args compare elementwise), so every outcome can be staged independently with no
// onceFor/FIFO sequencing needed. Pattern verified in git-detect-base-branch-broker.proxy.ts.
//
// buildPreflightBroker spawns via the SAME childProcessSpawnCaptureAdapter but with the command
// taken from `buildCommand` (e.g. 'npm'), which is a distinct command address from 'git' and does
// not collide — its own `.proxy.ts` staging methods are used directly below.
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
    buildCommand: string;
    sha: string;
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
  setupPopulateRejectsDiscardSucceeds: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
    sha: string;
    error: Error;
  }) => void;
  setupBuildFailsDiscardSucceeds: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
    buildCommand: string;
    sha: string;
    buildOutput: string;
  }) => void;
  setupBuildFailsDiscardAlsoFails: (params: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
    buildCommand: string;
    sha: string;
    buildOutput: string;
    removeFailureOutput: string;
  }) => void;
  getBuildSpawnedCwd: (params: { command: string }) => unknown;
  getBuildSpawnedArgs: (params: { command: string }) => unknown;
  getSpawnedArgsList: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged to satisfy enforce-proxy-child-creation: this proxy answers `spawn`
  // directly for every git call (see module comment above), so these adapter/broker proxies' own
  // constructor-level defaults never fire.
  gitWorktreeAddAdapterProxy();
  gitHeadShaAdapterProxy();
  worktreeDiscardBrokerProxy();
  // Instantiating this composes fsMkdirAdapterProxy + fsReaddirWithTypesAdapterProxy, whose own
  // constructor-level defaults (unstaged mkdir succeeds; unstaged readdir returns []) are enough
  // for worktreePopulateNodeModulesBroker to resolve cleanly with zero extra staging.
  const populateProxy = worktreePopulateNodeModulesBrokerProxy();
  const buildProxy = buildUntilGreenLayerBrokerProxy();

  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 128 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  const stageAddSucceeds = ({
    worktreePath,
    branchName,
    baseBranch,
  }: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
    baseBranch: BaseBranchName;
  }): void => {
    handle
      .calledWith(['git', ['worktree', 'add', worktreePath, '-b', branchName, baseBranch]])
      .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
  };

  const stageHeadShaSucceeds = ({ sha }: { sha: string }): void => {
    handle
      .calledWith(['git', ['rev-parse', 'HEAD']])
      .implement(() =>
        createGitChild({ exitCode: successCode, stderr: ErrorMessageStub({ value: `${sha}\n` }) }),
      );
  };

  const stageDiscardSucceeds = ({
    worktreePath,
    branchName,
  }: {
    worktreePath: AbsoluteFilePath;
    branchName: QuestBranchName;
  }): void => {
    handle
      .calledWith(['git', ['worktree', 'remove', '--force', worktreePath]])
      .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
    handle
      .calledWith(['git', ['branch', '-D', branchName]])
      .implement(() => createGitChild({ exitCode: successCode, stderr: emptyMessage }));
  };

  return {
    setupHappyPath: ({ worktreePath, branchName, baseBranch, buildCommand, sha }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaSucceeds({ sha });
      buildProxy.setupBuildSuccess({ command: buildCommand.split(' ')[0] ?? buildCommand });
    },

    setupWorktreeAddFails: ({ worktreePath, branchName, baseBranch, output }): void => {
      handle
        .calledWith(['git', ['worktree', 'add', worktreePath, '-b', branchName, baseBranch]])
        .implement(() =>
          createGitChild({ exitCode: failCode, stderr: ErrorMessageStub({ value: output }) }),
        );
    },

    setupHeadShaFailsDiscardSucceeds: ({ worktreePath, branchName, baseBranch }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      handle.calledWith(['git', ['rev-parse', 'HEAD']]).implement(() =>
        createGitChild({
          exitCode: failCode,
          stderr: ErrorMessageStub({ value: 'fatal: not a git repository' }),
        }),
      );
      stageDiscardSucceeds({ worktreePath, branchName });
    },

    setupPopulateRejectsDiscardSucceeds: ({
      worktreePath,
      branchName,
      baseBranch,
      sha,
      error,
    }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaSucceeds({ sha });
      populateProxy.setupMkdirThrows({
        filepath: FilePathStub({ value: `${worktreePath}/node_modules` }),
        error,
      });
      stageDiscardSucceeds({ worktreePath, branchName });
    },

    setupBuildFailsDiscardSucceeds: ({
      worktreePath,
      branchName,
      baseBranch,
      buildCommand,
      sha,
      buildOutput,
    }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaSucceeds({ sha });
      buildProxy.setupBuildFailure({
        command: buildCommand.split(' ')[0] ?? buildCommand,
        exitCode: failCode,
        output: buildOutput,
      });
      stageDiscardSucceeds({ worktreePath, branchName });
    },

    setupBuildFailsDiscardAlsoFails: ({
      worktreePath,
      branchName,
      baseBranch,
      buildCommand,
      sha,
      buildOutput,
      removeFailureOutput,
    }): void => {
      stageAddSucceeds({ worktreePath, branchName, baseBranch });
      stageHeadShaSucceeds({ sha });
      buildProxy.setupBuildFailure({
        command: buildCommand.split(' ')[0] ?? buildCommand,
        exitCode: failCode,
        output: buildOutput,
      });
      handle.calledWith(['git', ['worktree', 'remove', '--force', worktreePath]]).implement(() =>
        createGitChild({
          exitCode: failCode,
          stderr: ErrorMessageStub({ value: removeFailureOutput }),
        }),
      );
    },

    getBuildSpawnedCwd: ({ command }: { command: string }): unknown => {
      const call = handle.callsMatching([command]).at(-1);
      const options = call?.[2] as { cwd?: unknown } | undefined;
      return options?.cwd;
    },

    getBuildSpawnedArgs: ({ command }: { command: string }): unknown =>
      buildProxy.getSpawnedArgs({ command }),

    getSpawnedArgsList: (): readonly unknown[] =>
      handle.callsMatching(['git']).map((call) => call[1]),
  };
};
